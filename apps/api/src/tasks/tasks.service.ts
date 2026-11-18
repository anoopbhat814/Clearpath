import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateTaskDto, UpdateTaskDto, ListTaskQuery } from './tasks.dto';
import { defaultDueAt } from './sla';
import { AddTaskCommentDto, MoveTaskDto } from './tasks.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListTaskQuery, user: AuthUser) {
    const where: Prisma.TaskWhereInput = {};
    if (query.boardId !== undefined) where.boardId = query.boardId;
    if (query.status !== undefined) where.status = query.status;
    if (query.priority !== undefined) where.priority = query.priority;
    if (query.assigneeId !== undefined) where.assigneeId = query.assigneeId;
    if (query.q) {
      where.OR = [{ title: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
        include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.task.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.task.findFirst({
      where: { id },
      include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!row) throw new NotFoundException('Task not found');
    return row;
  }

  async update(id: string, dto: UpdateTaskDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.task.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    await this.prisma.task.delete({ where: { id } });
  }

  async create(dto: CreateTaskDto, user: AuthUser) {
    const board = await this.prisma.taskBoard.findUnique({ where: { id: dto.boardId } });
    if (!board) throw new NotFoundException('Task board not found');
    const priority = dto.priority ?? 'NORMAL';
    return this.prisma.task.create({
      data: {
        ...dto,
        priority,
        reporterId: user.id,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : defaultDueAt(priority, board.slaHours),
      },
    });
  }

  async move(id: string, dto: MoveTaskDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.task.update({
      where: { id },
      data: { status: dto.status, completedAt: dto.status === 'DONE' ? new Date() : null },
    });
  }

  async comment(id: string, dto: AddTaskCommentDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.taskComment.create({ data: { taskId: id, authorId: user.id, body: dto.body } });
  }

  /** Open tasks assigned to the caller, most urgent first. */
  mine(user: AuthUser) {
    return this.prisma.task.findMany({
      where: { assigneeId: user.id, status: { not: 'DONE' } },
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
      take: 100,
    });
  }
}
