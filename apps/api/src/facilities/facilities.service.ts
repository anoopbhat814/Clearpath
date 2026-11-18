import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateFacilityDto, UpdateFacilityDto, ListFacilityQuery } from './facilities.dto';

@Injectable()
export class FacilityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListFacilityQuery, user: AuthUser) {
    const where: Prisma.FacilityWhereInput = { organizationId: user.organizationId };
    if (query.active !== undefined) where.active = query.active;
    if (query.q) {
      where.OR = [{ name: { contains: query.q, mode: 'insensitive' } }, { code: { contains: query.q, mode: 'insensitive' } }, { city: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.facility.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { name: 'asc' },
        include: { departments: true },
      }),
      this.prisma.facility.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.facility.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { departments: true },
    });
    if (!row) throw new NotFoundException('Facility not found');
    return row;
  }

  async create(dto: CreateFacilityDto, user: AuthUser) {
    return this.prisma.facility.create({ data: { ...dto, organizationId: user.organizationId } });
  }

  async update(id: string, dto: UpdateFacilityDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.facility.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.facility.update({ where: { id }, data: { active: false } });
  }
}
