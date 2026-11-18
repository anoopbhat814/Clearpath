import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { CoverageService } from './coverages.service';
import { CreateCoverageDto, UpdateCoverageDto, ListCoverageQuery } from './coverages.dto';

@ApiTags('coverages')
@ApiBearerAuth()
@Audited('Coverage')
@Controller('coverages')
export class CoverageController {
  constructor(private readonly service: CoverageService) {}

  @Get()
  list(@Query() query: ListCoverageQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SCHEDULER)
  create(@Body() dto: CreateCoverageDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SCHEDULER)
  update(@Param('id') id: string, @Body() dto: UpdateCoverageDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.SCHEDULER)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.remove(id, user);
  }

  @Get(':id/eligibility')
  eligibility(@Param('id') id: string, @Query('on') on: string | undefined, @CurrentUser() user: AuthUser) {
    return this.service.eligibility(id, on, user);
  }
}
