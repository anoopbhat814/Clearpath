import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { PatientService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, ListPatientQuery } from './patients.dto';

@ApiTags('patients')
@ApiBearerAuth()
@Audited('Patient')
@Controller('patients')
export class PatientController {
  constructor(private readonly service: PatientService) {}

  @Get()
  list(@Query() query: ListPatientQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER, UserRole.BED_MANAGER)
  create(@Body() dto: CreatePatientDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN, UserRole.SCHEDULER, UserRole.BED_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Get(':id/timeline')
  timeline(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.timeline(id, user);
  }
}
