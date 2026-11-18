import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RiskClient } from './risk-client';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RiskClient],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
