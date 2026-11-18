import { Module } from '@nestjs/common';
import { CoverageController } from './coverages.controller';
import { CoverageService } from './coverages.service';

@Module({
  controllers: [CoverageController],
  providers: [CoverageService],
  exports: [CoverageService],
})
export class CoverageModule {}
