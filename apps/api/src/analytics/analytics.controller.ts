import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsService } from './analytics.service';

const clampDays = (raw: string | undefined, fallback: number) => Math.min(Math.max(Number(raw) || fallback, 1), 365);

@ApiTags('analytics')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.ANALYST, UserRole.COORDINATOR, UserRole.BED_MANAGER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.service.overview();
  }

  @Get('referral-funnel')
  referralFunnel(@Query('days') days?: string) {
    return this.service.referralFunnel(clampDays(days, 30));
  }

  @Get('authorization-outcomes')
  authorizationOutcomes(@Query('days') days?: string) {
    return this.service.authorizationOutcomes(clampDays(days, 90));
  }

  @Get('wards/:wardId/forecast')
  forecast(@Param('wardId') wardId: string, @Query('horizon') horizon?: string) {
    return this.service.capacityForecast(wardId, Math.min(Math.max(Number(horizon) || 7, 1), 28));
  }

  @Get('patients/:id/risk')
  @Roles(UserRole.ADMIN, UserRole.ANALYST, UserRole.CLINICIAN, UserRole.COORDINATOR)
  patientRisk(@Param('id') id: string) {
    return this.service.patientRisk(id);
  }
}
