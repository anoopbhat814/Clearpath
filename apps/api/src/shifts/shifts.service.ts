import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, ShiftStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateShiftDto, UpdateShiftDto, ListShiftQuery } from './shifts.dto';
import { validateShift } from './shift-rules';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListShiftQuery, user: AuthUser) {
    const where: Prisma.ShiftWhereInput = {};
    if (query.staffId !== undefined) where.staffId = query.staffId;
    if (query.status !== undefined) where.status = query.status;
    if (query.from) where.startsAt = { gte: new Date(query.from) };
    if (query.to) where.endsAt = { lte: new Date(query.to) };
    if (query.q) {
      where.OR = [{ role: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.shift.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { startsAt: 'asc' },
        include: { staff: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
      this.prisma.shift.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.shift.findFirst({
      where: { id },
      include: { staff: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    if (!row) throw new NotFoundException('Shift not found');
    return row;
  }

  async update(id: string, dto: UpdateShiftDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.shift.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.shift.delete({ where: { id } });
  }

  /** Creates a shift after checking overlap, weekly-hour and rest-period rules. */
  async create(dto: CreateShiftDto, _user: AuthUser) {
    const staff = await this.prisma.staffMember.findUnique({ where: { id: dto.staffId } });
    if (!staff) throw new NotFoundException('Staff member not found');

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const windowStart = new Date(startsAt.getTime() - 8 * 86_400_000);
    const windowEnd = new Date(endsAt.getTime() + 8 * 86_400_000);
    const existing = await this.prisma.shift.findMany({
      where: { staffId: dto.staffId, status: { not: ShiftStatus.CANCELLED }, startsAt: { gte: windowStart, lte: windowEnd } },
      select: { startsAt: true, endsAt: true },
    });

    const violations = validateShift({ startsAt, endsAt }, existing, { maxWeeklyHours: staff.maxWeeklyHours });
    if (violations.length > 0) {
      throw new UnprocessableEntityException({ message: 'Shift violates scheduling rules', violations });
    }
    return this.prisma.shift.create({ data: { ...dto, startsAt, endsAt } });
  }

  async setStatus(id: string, status: ShiftStatus, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.shift.update({ where: { id }, data: { status } });
  }
}
