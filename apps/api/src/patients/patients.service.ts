import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreatePatientDto, UpdatePatientDto, ListPatientQuery } from './patients.dto';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPatientQuery, user: AuthUser) {
    const where: Prisma.PatientWhereInput = {};
    if (query.q) {
      where.OR = [{ lastName: { contains: query.q, mode: 'insensitive' } }, { firstName: { contains: query.q, mode: 'insensitive' } }, { mrn: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { lastName: 'asc' },
        include: { coverages: { include: { plan: true } } },
      }),
      this.prisma.patient.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.patient.findFirst({
      where: { id },
      include: { coverages: { include: { plan: true } } },
    });
    if (!row) throw new NotFoundException('Patient not found');
    return row;
  }

  async create(dto: CreatePatientDto, user: AuthUser) {
    return this.prisma.patient.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdatePatientDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.patient.update({ where: { id }, data: dto });
  }

  /** Merged, newest-first view of everything touching a patient. */
  async timeline(id: string, user: AuthUser) {
    await this.get(id, user);
    const [referrals, authorizations, tasks] = await this.prisma.$transaction([
      this.prisma.referral.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.priorAuthorization.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.task.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    return [
      ...referrals.map((r) => ({ type: 'referral', id: r.id, label: `${r.reference} (${r.status})`, at: r.createdAt })),
      ...authorizations.map((a) => ({ type: 'authorization', id: a.id, label: `${a.reference} (${a.status})`, at: a.createdAt })),
      ...tasks.map((t) => ({ type: 'task', id: t.id, label: t.title, at: t.createdAt })),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());
  }
}
