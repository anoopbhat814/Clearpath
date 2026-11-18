import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { ProviderService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto, ListProviderQuery } from './providers.dto';
import { AssignSpecialtyDto } from './providers.dto';

@ApiTags('providers')
@ApiBearerAuth()
@Audited('Provider')
@Controller('providers')
export class ProviderController {
  constructor(private readonly service: ProviderService) {}

  @Get()
  list(@Query() query: ListProviderQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  create(@Body() dto: CreateProviderDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  update(@Param('id') id: string, @Body() dto: UpdateProviderDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/specialties')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  addSpecialty(@Param('id') id: string, @Body() dto: AssignSpecialtyDto, @CurrentUser() user: AuthUser) {
    return this.service.addSpecialty(id, dto, user);
  }
}
