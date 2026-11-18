import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { TaskService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, ListTaskQuery } from './tasks.dto';
import { AddTaskCommentDto, MoveTaskDto } from './tasks.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Audited('Task')
@Controller('tasks')
export class TaskController {
  constructor(private readonly service: TaskService) {}

  @Get()
  list(@Query() query: ListTaskQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get('mine/open')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.mine(user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER, UserRole.BED_MANAGER)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER, UserRole.BED_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER, UserRole.BED_MANAGER)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.remove(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER, UserRole.BED_MANAGER)
  move(@Param('id') id: string, @Body() dto: MoveTaskDto, @CurrentUser() user: AuthUser) {
    return this.service.move(id, dto, user);
  }

  @Post(':id/comments')
  comment(@Param('id') id: string, @Body() dto: AddTaskCommentDto, @CurrentUser() user: AuthUser) {
    return this.service.comment(id, dto, user);
  }
}
