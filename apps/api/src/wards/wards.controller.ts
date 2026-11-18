import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { WardService } from './wards.service';
import { CreateWardDto, UpdateWardDto, ListWardQuery } from './wards.dto';

@ApiTags('wards')
@ApiBearerAuth()
@Audited('Ward')
@Controller('wards')
export class WardController {
  constructor(private readonly service: WardService) {}

  @Get()
  list(@Query() query: ListWardQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get('overview/occupancy')
  overview(@Query('facilityId') facilityId?: string) {
    return this.service.overview(facilityId);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER)
  create(@Body() dto: CreateWardDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateWardDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.remove(id, user);
  }

  @Get(':id/occupancy')
  occupancy(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.occupancy(id, user);
  }
}
