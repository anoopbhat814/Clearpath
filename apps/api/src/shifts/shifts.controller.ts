import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { ShiftService } from './shifts.service';
import { CreateShiftDto, UpdateShiftDto, ListShiftQuery } from './shifts.dto';

@ApiTags('shifts')
@ApiBearerAuth()
@Audited('Shift')
@Controller('shifts')
export class ShiftController {
  constructor(private readonly service: ShiftService) {}

  @Get()
  list(@Query() query: ListShiftQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  create(@Body() dto: CreateShiftDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.remove(id, user);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  confirm(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.setStatus(id, 'CONFIRMED', user);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.setStatus(id, 'CANCELLED', user);
  }
}
