import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateInsurancePlanDto, UpdateInsurancePlanDto, ListInsurancePlanQuery } from './insurance-plans.dto';

@Injectable()
export class InsurancePlanService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListInsurancePlanQuery, user: AuthUser) {
    const where: Prisma.InsurancePlanWhereInput = { organizationId: user.organizationId };
    if (query.requiresAuth !== undefined) where.requiresAuth = query.requiresAuth;
    if (query.q) {
      where.OR = [{ payerName: { contains: query.q, mode: 'insensitive' } }, { planName: { contains: query.q, mode: 'insensitive' } }, { planCode: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insurancePlan.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { payerName: 'asc' },
      }),
      this.prisma.insurancePlan.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.insurancePlan.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!row) throw new NotFoundException('InsurancePlan not found');
    return row;
  }

  async create(dto: CreateInsurancePlanDto, user: AuthUser) {
    return this.prisma.insurancePlan.create({ data: { ...dto, organizationId: user.organizationId } });
  }

  async update(id: string, dto: UpdateInsurancePlanDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.insurancePlan.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.insurancePlan.delete({ where: { id } });
  }
}
