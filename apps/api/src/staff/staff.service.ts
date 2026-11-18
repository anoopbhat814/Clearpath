import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateStaffMemberDto, UpdateStaffMemberDto, ListStaffMemberQuery } from './staff.dto';

@Injectable()
export class StaffMemberService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListStaffMemberQuery, user: AuthUser) {
    const where: Prisma.StaffMemberWhereInput = {};
    if (query.facilityId !== undefined) where.facilityId = query.facilityId;
    if (query.departmentId !== undefined) where.departmentId = query.departmentId;
    if (query.q) {
      where.OR = [{ jobTitle: { contains: query.q, mode: 'insensitive' } }, { employeeCode: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.staffMember.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { employeeCode: 'asc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
      }),
      this.prisma.staffMember.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.staffMember.findFirst({
      where: { id },
      include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
    if (!row) throw new NotFoundException('StaffMember not found');
    return row;
  }

  async create(dto: CreateStaffMemberDto, user: AuthUser) {
    return this.prisma.staffMember.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateStaffMemberDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.staffMember.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.staffMember.delete({ where: { id } });
  }
}
