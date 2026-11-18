import { Module } from '@nestjs/common';
import { WardController } from './wards.controller';
import { WardService } from './wards.service';

@Module({
  controllers: [WardController],
  providers: [WardService],
  exports: [WardService],
})
export class WardModule {}
