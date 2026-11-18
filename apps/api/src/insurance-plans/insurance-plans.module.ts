import { Module } from '@nestjs/common';
import { InsurancePlanController } from './insurance-plans.controller';
import { InsurancePlanService } from './insurance-plans.service';

@Module({
  controllers: [InsurancePlanController],
  providers: [InsurancePlanService],
  exports: [InsurancePlanService],
})
export class InsurancePlanModule {}
