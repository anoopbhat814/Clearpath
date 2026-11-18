import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { TaskBoardService } from './task-boards.service';
import { CreateTaskBoardDto, UpdateTaskBoardDto, ListTaskBoardQuery } from './task-boards.dto';

@ApiTags('task-boards')
@ApiBearerAuth()
@Audited('TaskBoard')
@Controller('task-boards')
export class TaskBoardController {
  constructor(private readonly service: TaskBoardService) {}

  @Get()
  list(@Query() query: ListTaskBoardQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  create(@Body() dto: CreateTaskBoardDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  update(@Param('id') id: string, @Body() dto: UpdateTaskBoardDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.remove(id, user);
  }

  @Get(':id/summary')
  summary(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.summary(id, user);
  }
}
