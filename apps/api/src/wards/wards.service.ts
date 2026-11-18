import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateWardDto, UpdateWardDto, ListWardQuery } from './wards.dto';
import { summarizeBeds } from '../beds/capacity';

@Injectable()
export class WardService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListWardQuery, user: AuthUser) {
    const where: Prisma.WardWhereInput = {};
    if (query.facilityId !== undefined) where.facilityId = query.facilityId;
    if (query.type !== undefined) where.type = query.type;
    if (query.q) {
      where.OR = [{ name: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.ward.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { name: 'asc' },
        include: { _count: { select: { beds: true } } },
      }),
      this.prisma.ward.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.ward.findFirst({
      where: { id },
      include: { _count: { select: { beds: true } } },
    });
    if (!row) throw new NotFoundException('Ward not found');
    return row;
  }

  async create(dto: CreateWardDto, user: AuthUser) {
    return this.prisma.ward.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateWardDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.ward.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.ward.delete({ where: { id } });
  }

  async occupancy(id: string, user: AuthUser) {
    await this.get(id, user);
    const beds = await this.prisma.bed.findMany({ where: { wardId: id }, select: { status: true } });
    return summarizeBeds(beds);
  }

  /** Occupancy for every ward, optionally limited to one facility. */
  async overview(facilityId?: string) {
    const wards = await this.prisma.ward.findMany({
      where: facilityId ? { facilityId } : {},
      include: { beds: { select: { status: true } } },
      orderBy: { name: 'asc' },
    });
    return wards.map((w) => ({ wardId: w.id, name: w.name, type: w.type, ...summarizeBeds(w.beds) }));
  }
}
