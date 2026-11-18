import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { PriorAuthorizationService } from './authorizations.service';
import { CreatePriorAuthorizationDto, UpdatePriorAuthorizationDto, ListPriorAuthorizationQuery } from './authorizations.dto';
import { TransitionAuthorizationDto } from './authorizations.dto';

@ApiTags('authorizations')
@ApiBearerAuth()
@Audited('PriorAuthorization')
@Controller('authorizations')
export class PriorAuthorizationController {
  constructor(private readonly service: PriorAuthorizationService) {}

  @Get()
  list(@Query() query: ListPriorAuthorizationQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get('expiring')
  expiring(@Query('days') days: string | undefined, @CurrentUser() user: AuthUser) {
    return this.service.expiring(Math.min(Math.max(Number(days) || 7, 1), 90), user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN)
  create(@Body() dto: CreatePriorAuthorizationDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN)
  update(@Param('id') id: string, @Body() dto: UpdatePriorAuthorizationDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/transition')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN)
  transition(@Param('id') id: string, @Body() dto: TransitionAuthorizationDto, @CurrentUser() user: AuthUser) {
    return this.service.transition(id, dto, user);
  }
}
