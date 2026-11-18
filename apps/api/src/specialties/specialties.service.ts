import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateSpecialtyDto, UpdateSpecialtyDto, ListSpecialtyQuery } from './specialties.dto';

@Injectable()
export class SpecialtyService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListSpecialtyQuery, user: AuthUser) {
    const where: Prisma.SpecialtyWhereInput = {};
    if (query.q) {
      where.OR = [{ name: { contains: query.q, mode: 'insensitive' } }, { code: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.specialty.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { name: 'asc' },
      }),
      this.prisma.specialty.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.specialty.findFirst({
      where: { id },
    });
    if (!row) throw new NotFoundException('Specialty not found');
    return row;
  }

  async create(dto: CreateSpecialtyDto, user: AuthUser) {
    return this.prisma.specialty.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateSpecialtyDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.specialty.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.specialty.delete({ where: { id } });
  }
}
