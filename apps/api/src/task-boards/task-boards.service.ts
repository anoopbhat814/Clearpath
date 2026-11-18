import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateTaskBoardDto, UpdateTaskBoardDto, ListTaskBoardQuery } from './task-boards.dto';

@Injectable()
export class TaskBoardService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListTaskBoardQuery, user: AuthUser) {
    const where: Prisma.TaskBoardWhereInput = {};
    if (query.departmentId !== undefined) where.departmentId = query.departmentId;
    if (query.q) {
      where.OR = [{ name: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.taskBoard.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { name: 'asc' },
        include: { _count: { select: { tasks: true } } },
      }),
      this.prisma.taskBoard.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.taskBoard.findFirst({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
    if (!row) throw new NotFoundException('TaskBoard not found');
    return row;
  }

  async create(dto: CreateTaskBoardDto, user: AuthUser) {
    return this.prisma.taskBoard.create({ data: { ...dto } });
  }

  async update(id: string, dto: UpdateTaskBoardDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.taskBoard.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.taskBoard.delete({ where: { id } });
  }

  /** Task counts per status plus the number of overdue open tasks. */
  async summary(id: string, user: AuthUser) {
    const board = await this.get(id, user);
    const [groups, overdue] = await this.prisma.$transaction([
      this.prisma.task.groupBy({ by: ['status'], where: { boardId: id }, orderBy: { status: 'asc' }, _count: { _all: true } }),
      this.prisma.task.count({ where: { boardId: id, status: { not: 'DONE' }, dueAt: { lt: new Date() } } }),
    ]);
    const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all]));
    return { boardId: id, name: board.name, slaHours: board.slaHours, counts, overdue };
  }
}
