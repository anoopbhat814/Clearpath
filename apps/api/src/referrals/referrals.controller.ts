import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { ReferralService } from './referrals.service';
import { CreateReferralDto, UpdateReferralDto, ListReferralQuery } from './referrals.dto';
import { AddReferralNoteDto, TransitionReferralDto } from './referrals.dto';

@ApiTags('referrals')
@ApiBearerAuth()
@Audited('Referral')
@Controller('referrals')
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  @Get()
  list(@Query() query: ListReferralQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get('queue/triage')
  triageQueue(@CurrentUser() user: AuthUser) {
    return this.service.triageQueue(user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER)
  create(@Body() dto: CreateReferralDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER)
  update(@Param('id') id: string, @Body() dto: UpdateReferralDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/transition')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER)
  transition(@Param('id') id: string, @Body() dto: TransitionReferralDto, @CurrentUser() user: AuthUser) {
    return this.service.transition(id, dto, user);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() dto: AddReferralNoteDto, @CurrentUser() user: AuthUser) {
    return this.service.addNote(id, dto, user);
  }
}
