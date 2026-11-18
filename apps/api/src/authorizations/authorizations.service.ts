import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, AuthStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreatePriorAuthorizationDto, UpdatePriorAuthorizationDto, ListPriorAuthorizationQuery } from './authorizations.dto';
import { randomBytes } from 'crypto';
import { assertAuthTransition, buildAuthReference, classifyExpiry, validateDecision } from './auth-rules';
import { TransitionAuthorizationDto } from './authorizations.dto';

@Injectable()
export class PriorAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPriorAuthorizationQuery, user: AuthUser) {
    const where: Prisma.PriorAuthorizationWhereInput = {};
    if (query.status !== undefined) where.status = query.status;
    if (query.patientId !== undefined) where.patientId = query.patientId;
    if (query.q) {
      where.OR = [{ reference: { contains: query.q, mode: 'insensitive' } }, { serviceCode: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.priorAuthorization.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { createdAt: 'desc' },
        include: { coverage: { include: { plan: true } } },
      }),
      this.prisma.priorAuthorization.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.priorAuthorization.findFirst({
      where: { id },
      include: { coverage: { include: { plan: true } } },
    });
    if (!row) throw new NotFoundException('PriorAuthorization not found');
    return row;
  }

  async update(id: string, dto: UpdatePriorAuthorizationDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.priorAuthorization.update({ where: { id }, data: dto });
  }

  async create(dto: CreatePriorAuthorizationDto, user: AuthUser) {
    const coverage = await this.prisma.coverage.findUnique({ where: { id: dto.coverageId } });
    if (!coverage || coverage.patientId !== dto.patientId) {
      throw new BadRequestException('Coverage does not belong to the patient');
    }
    return this.prisma.priorAuthorization.create({
      data: {
        ...dto,
        reference: buildAuthReference(new Date(), randomBytes(5).toString('hex')),
        requestedById: user.id,
      },
    });
  }

  async transition(id: string, dto: TransitionAuthorizationDto, user: AuthUser) {
    const auth = await this.get(id, user);
    assertAuthTransition(auth.status, dto.status);
    validateDecision(dto.status, dto);

    const now = new Date();
    const data: Prisma.PriorAuthorizationUpdateInput = { status: dto.status };
    if (dto.status === AuthStatus.SUBMITTED) data.submittedAt = now;
    if (dto.status === AuthStatus.APPROVED || dto.status === AuthStatus.DENIED) data.decidedAt = now;
    if (dto.denialReason) data.denialReason = dto.denialReason;
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);

    const [updated] = await this.prisma.$transaction([
      this.prisma.priorAuthorization.update({ where: { id }, data }),
      this.prisma.authorizationEvent.create({
        data: { authorizationId: id, actorId: user.id, fromStatus: auth.status, toStatus: dto.status, note: dto.note },
      }),
    ]);
    return updated;
  }

  /** Approved authorizations whose validity ends within the next `days` days. */
  async expiring(days: number, _user: AuthUser) {
    const horizon = new Date(Date.now() + days * 86_400_000);
    const rows = await this.prisma.priorAuthorization.findMany({
      where: { status: AuthStatus.APPROVED, validUntil: { lte: horizon } },
      orderBy: { validUntil: 'asc' },
      take: 200,
    });
    return rows.map((r) => ({ ...r, expiry: classifyExpiry(r.validUntil, new Date(), days) }));
  }
}
