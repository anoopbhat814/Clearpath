import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, ReferralStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateReferralDto, UpdateReferralDto, ListReferralQuery } from './referrals.dto';
import { randomBytes } from 'crypto';
import { assertTransition, buildReference, compareForTriage, triageBreached } from './referral-state';
import { AddReferralNoteDto, TransitionReferralDto } from './referrals.dto';

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListReferralQuery, user: AuthUser) {
    const where: Prisma.ReferralWhereInput = {};
    if (query.status !== undefined) where.status = query.status;
    if (query.priority !== undefined) where.priority = query.priority;
    if (query.patientId !== undefined) where.patientId = query.patientId;
    if (query.providerId !== undefined) where.providerId = query.providerId;
    if (query.q) {
      where.OR = [{ reference: { contains: query.q, mode: 'insensitive' } }, { reason: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.referral.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { createdAt: 'desc' },
        include: { patient: { select: { id: true, mrn: true, firstName: true, lastName: true } }, specialty: true, provider: true },
      }),
      this.prisma.referral.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.referral.findFirst({
      where: { id },
      include: { patient: { select: { id: true, mrn: true, firstName: true, lastName: true } }, specialty: true, provider: true },
    });
    if (!row) throw new NotFoundException('Referral not found');
    return row;
  }

  async update(id: string, dto: UpdateReferralDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.referral.update({ where: { id }, data: dto });
  }

  async create(dto: CreateReferralDto, user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (patient.deceased) throw new BadRequestException('Cannot create a referral for a deceased patient');
    return this.prisma.referral.create({
      data: {
        ...dto,
        reference: buildReference(new Date(), randomBytes(4).toString('hex')),
        createdById: user.id,
      },
    });
  }

  async transition(id: string, dto: TransitionReferralDto, user: AuthUser) {
    const referral = await this.get(id, user);
    assertTransition(referral.status, dto.status);

    const now = new Date();
    const data: Prisma.ReferralUpdateInput = { status: dto.status };
    if (dto.status === ReferralStatus.TRIAGED) data.triagedAt = now;
    if (dto.status === ReferralStatus.SCHEDULED) {
      if (!dto.scheduledAt) throw new BadRequestException('scheduledAt is required to schedule a referral');
      data.scheduledAt = new Date(dto.scheduledAt);
      if (dto.providerId) data.provider = { connect: { id: dto.providerId } };
    }
    if (['COMPLETED', 'DECLINED', 'CANCELLED'].includes(dto.status)) data.closedAt = now;

    const updated = await this.prisma.referral.update({ where: { id }, data });
    if (dto.note) {
      await this.prisma.referralNote.create({ data: { referralId: id, authorId: user.id, body: dto.note } });
    }
    return updated;
  }

  /** Submitted referrals waiting for triage, most urgent and longest-waiting first. */
  async triageQueue(_user: AuthUser) {
    const rows = await this.prisma.referral.findMany({
      where: { status: ReferralStatus.SUBMITTED },
      include: { patient: { select: { id: true, mrn: true, firstName: true, lastName: true } }, specialty: true },
      take: 200,
    });
    const now = new Date();
    return rows.sort(compareForTriage).map((r) => ({ ...r, slaBreached: triageBreached(r, now) }));
  }

  async addNote(id: string, dto: AddReferralNoteDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.referralNote.create({
      data: { referralId: id, authorId: user.id, body: dto.body, internal: dto.internal ?? true },
    });
  }
}
