import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { StaffMemberService } from './staff.service';
import { CreateStaffMemberDto, UpdateStaffMemberDto, ListStaffMemberQuery } from './staff.dto';

@ApiTags('staff')
@ApiBearerAuth()
@Audited('StaffMember')
@Controller('staff')
export class StaffMemberController {
  constructor(private readonly service: StaffMemberService) {}

  @Get()
  list(@Query() query: ListStaffMemberQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  create(@Body() dto: CreateStaffMemberDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  update(@Param('id') id: string, @Body() dto: UpdateStaffMemberDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.remove(id, user);
  }
}
