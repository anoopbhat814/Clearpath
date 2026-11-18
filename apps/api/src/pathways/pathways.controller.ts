import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { CarePathwayService } from './pathways.service';
import { CreateCarePathwayDto, UpdateCarePathwayDto, ListCarePathwayQuery } from './pathways.dto';
import { AddStepDto, EnrollPatientDto } from './pathways.dto';

@ApiTags('pathways')
@ApiBearerAuth()
@Audited('CarePathway')
@Controller('pathways')
export class CarePathwayController {
  constructor(private readonly service: CarePathwayService) {}

  @Get()
  list(@Query() query: ListCarePathwayQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Post('enrollments/:enrollmentId/advance')
  @HttpCode(200)
  advance(@Param('enrollmentId') enrollmentId: string) {
    return this.service.advance(enrollmentId);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  create(@Body() dto: CreateCarePathwayDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  update(@Param('id') id: string, @Body() dto: UpdateCarePathwayDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/steps')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  addStep(@Param('id') id: string, @Body() dto: AddStepDto, @CurrentUser() user: AuthUser) {
    return this.service.addStep(id, dto, user);
  }

  @Post(':id/enroll')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.CLINICIAN)
  enroll(@Param('id') id: string, @Body() dto: EnrollPatientDto, @CurrentUser() user: AuthUser) {
    return this.service.enroll(id, dto, user);
  }
}
