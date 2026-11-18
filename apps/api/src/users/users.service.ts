import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { skipTake, toPage } from '../common/paginate';
import type { AuthUser } from '../common/types';
import { CreateUserDto, UpdateUserDto, ListUserQuery } from './users.dto';
import { assertPasswordStrength, hashPassword } from '../auth/password';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUserQuery, user: AuthUser) {
    const where: Prisma.UserWhereInput = { organizationId: user.organizationId };
    if (query.role !== undefined) where.role = query.role;
    if (query.active !== undefined) where.active = query.active;
    if (query.q) {
      where.OR = [{ lastName: { contains: query.q, mode: 'insensitive' } }, { firstName: { contains: query.q, mode: 'insensitive' } }, { email: { contains: query.q, mode: 'insensitive' } }];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        ...skipTake(query.page, query.pageSize),
        orderBy: { lastName: 'asc' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true, lastLoginAt: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return toPage(items, total, query.page, query.pageSize);
  }

  async get(id: string, user: AuthUser) {
    const row = await this.prisma.user.findFirst({
      where: { id, organizationId: user.organizationId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, active: true, lastLoginAt: true, createdAt: true },
    });
    if (!row) throw new NotFoundException('User not found');
    return row;
  }

  async update(id: string, dto: UpdateUserDto, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.get(id, user);
    return this.prisma.user.update({ where: { id }, data: { active: false } });
  }

  async create(dto: CreateUserDto, user: AuthUser) {
    try {
      assertPasswordStrength(dto.password);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
    const { password, ...rest } = dto;
    return this.prisma.user.create({
      data: {
        ...rest,
        email: rest.email.toLowerCase(),
        passwordHash: await hashPassword(password),
        organizationId: user.organizationId,
      },
      select: { id: true, email: true, role: true },
    });
  }
}
