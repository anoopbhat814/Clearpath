import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Audited } from '../common/decorators/audited.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthUser } from '../common/types';
import { BedService } from './beds.service';
import { CreateBedDto, UpdateBedDto, ListBedQuery } from './beds.dto';
import { AdmitPatientDto, SetBedStatusDto } from './beds.dto';

@ApiTags('beds')
@ApiBearerAuth()
@Audited('Bed')
@Controller('beds')
export class BedController {
  constructor(private readonly service: BedService) {}

  @Get()
  list(@Query() query: ListBedQuery, @CurrentUser() user: AuthUser) {
    return this.service.list(query, user);
  }

  @Get('available/search')
  available(
    @Query('isolation') isolation?: string,
    @Query('telemetry') telemetry?: string,
    @Query('wardId') wardId?: string,
  ) {
    return this.service.available({ isolation: isolation === 'true', telemetry: telemetry === 'true', wardId });
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER)
  create(@Body() dto: CreateBedDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateBedDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.remove(id, user);
  }

  @Post(':id/admit')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER, UserRole.COORDINATOR, UserRole.CLINICIAN)
  admit(@Param('id') id: string, @Body() dto: AdmitPatientDto, @CurrentUser() user: AuthUser) {
    return this.service.admit(id, dto, user);
  }

  @Post(':id/discharge')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER, UserRole.CLINICIAN)
  discharge(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.discharge(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.BED_MANAGER)
  setStatus(@Param('id') id: string, @Body() dto: SetBedStatusDto, @CurrentUser() user: AuthUser) {
    return this.service.setStatus(id, dto, user);
  }
}
