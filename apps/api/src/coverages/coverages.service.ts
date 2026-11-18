import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateCoverageDto, UpdateCoverageDto, ListCoverageQuery } from './coverages.dto';

@Injectable()
export class CoverageService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListCoverageQuery, user: AuthUser) {
    const where: Prisma.CoverageWhereInput = {};
    if (query.patientId !== undefined) where.patientId = query.patientId;
    if (query.planId !== undefined) where.planId = query.planId;
    if (query.q) {
      where.OR = [{ memberId: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.coverage.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { effectiveFrom: 'desc' },
        include: { plan: true },
      }),
      this.prisma.coverage.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.coverage.findFirst({
      where: { id },
      include: { plan: true },
    });
    if (!row) throw new NotFoundException('Coverage not found');
    return row;
  }

  async create(dto: CreateCoverageDto, user: AuthUser) {
    return this.prisma.coverage.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateCoverageDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.coverage.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.coverage.delete({ where: { id } });
  }

  async eligibility(id: string, on: string | undefined, user: AuthUser) {
    const coverage = await this.get(id, user);
    const at = on ? new Date(on) : new Date();
    const active = coverage.effectiveFrom <= at && (!coverage.effectiveTo || coverage.effectiveTo >= at);
    return { coverageId: id, on: at.toISOString(), active, requiresAuth: coverage.plan.requiresAuth };
  }
}
