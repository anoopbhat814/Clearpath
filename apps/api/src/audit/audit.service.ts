import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import { toCsv } from './csv';
import { ExportAuditQuery, ListAuditQuery } from './audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  private rangeFilter(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;
    return { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) };
  }

  async list(query: ListAuditQuery) {
    const where: Prisma.AuditLogWhereInput = {
      actorId: query.actorId,
      action: query.action,
      entityType: query.entityType,
      createdAt: this.rangeFilter(query.from, query.to),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  entityHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /** Exporting the trail is itself an audited action. */
  async exportCsv(query: ExportAuditQuery, actorId: string): Promise<string> {
    const rows = await this.prisma.auditLog.findMany({
      where: { createdAt: this.rangeFilter(query.from, query.to) },
      orderBy: { createdAt: 'asc' },
      take: query.limit,
    });
    await this.prisma.auditLog.create({
      data: { actorId, action: AuditAction.EXPORT, entityType: 'AuditLog', metadata: { rows: rows.length } },
    });
    return toCsv(rows as unknown as Record<string, unknown>[], [
      'id', 'createdAt', 'actorId', 'action', 'entityType', 'entityId', 'ip', 'requestId',
    ]);
  }
}
