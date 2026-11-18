import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditAction } from '@prisma/client';
import { Observable, tap } from 'rxjs';
import { PrismaService } from './prisma.service';
import { AuditForwarder } from './audit-forwarder.service';
import { AUDIT_ENTITY_KEY } from './decorators/audited.decorator';

const METHOD_ACTIONS: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
  GET: AuditAction.READ,
};

/**
 * Persists an audit record for every request handled by a controller marked with @Audited().
 * Failures to write the audit trail never break the request; they are logged instead.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly forwarder: AuditForwarder,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const entityType = this.reflector.get<string | undefined>(AUDIT_ENTITY_KEY, context.getClass());
    if (!entityType) return next.handle();

    const req = context.switchToHttp().getRequest();
    const action = METHOD_ACTIONS[req.method];
    if (!action) return next.handle();

    return next.handle().pipe(
      tap((result) => {
        const entityId = req.params?.id ?? (result as { id?: string } | null)?.id ?? null;
        this.prisma.auditLog
          .create({
            data: {
              actorId: req.user?.id ?? null,
              action,
              entityType,
              entityId,
              ip: req.ip,
              requestId: req.requestId,
              metadata: { route: req.route?.path, method: req.method },
            },
          })
          .catch((err) => this.logger.error(`audit write failed: ${err.message}`));
        void this.forwarder.forward([
          {
            actorId: req.user?.id ?? null,
            action,
            entityType,
            entityId,
            requestId: req.requestId,
            occurredAt: new Date().toISOString(),
          },
        ]);
      }),
    );
  }
}
