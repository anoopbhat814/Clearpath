import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma, BedStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateBedDto, UpdateBedDto, ListBedQuery } from './beds.dto';
import { matchBeds } from './capacity';
import { AdmitPatientDto, SetBedStatusDto } from './beds.dto';

@Injectable()
export class BedService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListBedQuery, user: AuthUser) {
    const where: Prisma.BedWhereInput = {};
    if (query.wardId !== undefined) where.wardId = query.wardId;
    if (query.status !== undefined) where.status = query.status;
    if (query.isolation !== undefined) where.isolation = query.isolation;
    if (query.telemetry !== undefined) where.telemetry = query.telemetry;
    if (query.q) {
      where.OR = [{ label: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.bed.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { label: 'asc' },
        include: { ward: true },
      }),
      this.prisma.bed.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.bed.findFirst({
      where: { id },
      include: { ward: true },
    });
    if (!row) throw new NotFoundException('Bed not found');
    return row;
  }

  async create(dto: CreateBedDto, user: AuthUser) {
    return this.prisma.bed.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateBedDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.bed.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.bed.delete({ where: { id } });
  }

  /** Available beds, optionally narrowed by isolation or telemetry capability. */
  async available(needs: { isolation?: boolean; telemetry?: boolean; wardId?: string }) {
    const beds = await this.prisma.bed.findMany({
      where: { status: BedStatus.AVAILABLE, ...(needs.wardId ? { wardId: needs.wardId } : {}) },
      include: { ward: true },
      take: 200,
    });
    return matchBeds(beds, needs);
  }

  /** Atomically claims the bed; a concurrent admit to the same bed gets a conflict. */
  async admit(id: string, dto: AdmitPatientDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.bed.updateMany({
        where: { id, status: BedStatus.AVAILABLE },
        data: { status: BedStatus.OCCUPIED },
      });
      if (claimed.count === 0) throw new ConflictException('Bed is not available');
      return tx.bedAssignment.create({
        data: {
          bedId: id,
          patientId: dto.patientId,
          expectedDischarge: dto.expectedDischarge ? new Date(dto.expectedDischarge) : undefined,
        },
      });
    });
  }

  async discharge(id: string, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.$transaction(async (tx) => {
      const open = await tx.bedAssignment.findFirst({ where: { bedId: id, dischargedAt: null } });
      if (!open) throw new BadRequestException('Bed has no active assignment');
      await tx.bedAssignment.update({ where: { id: open.id }, data: { dischargedAt: new Date() } });
      return tx.bed.update({ where: { id }, data: { status: BedStatus.CLEANING } });
    });
  }

  async setStatus(id: string, dto: SetBedStatusDto, user: AuthUser) {
    const bed = await this.get(id, user);
    if (bed.status === BedStatus.OCCUPIED && dto.status !== BedStatus.OCCUPIED) {
      throw new BadRequestException('Discharge the patient before changing an occupied bed');
    }
    return this.prisma.bed.update({ where: { id }, data: { status: dto.status } });
  }
}
