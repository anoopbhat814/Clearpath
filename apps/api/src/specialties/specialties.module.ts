import { Module } from '@nestjs/common';
import { SpecialtyController } from './specialties.controller';
import { SpecialtyService } from './specialties.service';

@Module({
  controllers: [SpecialtyController],
  providers: [SpecialtyService],
  exports: [SpecialtyService],
})
export class SpecialtyModule {}
