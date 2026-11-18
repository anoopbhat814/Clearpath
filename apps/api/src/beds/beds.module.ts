import { Module } from '@nestjs/common';
import { BedController } from './beds.controller';
import { BedService } from './beds.service';

@Module({
  controllers: [BedController],
  providers: [BedService],
  exports: [BedService],
})
export class BedModule {}
