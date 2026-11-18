import { Module } from '@nestjs/common';
import { CarePathwayController } from './pathways.controller';
import { CarePathwayService } from './pathways.service';

@Module({
  controllers: [CarePathwayController],
  providers: [CarePathwayService],
  exports: [CarePathwayService],
})
export class CarePathwayModule {}
