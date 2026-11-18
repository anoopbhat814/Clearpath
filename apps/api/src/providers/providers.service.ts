import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateProviderDto, UpdateProviderDto, ListProviderQuery } from './providers.dto';
import { AssignSpecialtyDto } from './providers.dto';

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProviderQuery, user: AuthUser) {
    const where: Prisma.ProviderWhereInput = {};
    if (query.networkStatus !== undefined) where.networkStatus = query.networkStatus;
    if (query.acceptingNew !== undefined) where.acceptingNew = query.acceptingNew;
    if (query.facilityId !== undefined) where.facilityId = query.facilityId;
    if (query.specialtyCode) {
      where.specialties = { some: { specialty: { code: query.specialtyCode } } };
    }
    if (query.q) {
      where.OR = [{ lastName: { contains: query.q, mode: 'insensitive' } }, { firstName: { contains: query.q, mode: 'insensitive' } }, { npi: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.provider.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { lastName: 'asc' },
        include: { specialties: { include: { specialty: true } }, facility: true },
      }),
      this.prisma.provider.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.provider.findFirst({
      where: { id },
      include: { specialties: { include: { specialty: true } }, facility: true },
    });
    if (!row) throw new NotFoundException('Provider not found');
    return row;
  }

  async create(dto: CreateProviderDto, user: AuthUser) {
    return this.prisma.provider.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateProviderDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.provider.update({ where: { id }, data: dto });
  }

  async addSpecialty(id: string, dto: AssignSpecialtyDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.$transaction(async (tx) => {
      if (dto.primary) {
        await tx.providerSpecialty.updateMany({ where: { providerId: id }, data: { primary: false } });
      }
      return tx.providerSpecialty.upsert({
        where: { providerId_specialtyId: { providerId: id, specialtyId: dto.specialtyId } },
        create: { providerId: id, specialtyId: dto.specialtyId, primary: dto.primary ?? false },
        update: { primary: dto.primary ?? false },
      });
    });
  }
}
