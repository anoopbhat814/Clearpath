import { Module } from '@nestjs/common';
import { ReferralController } from './referrals.controller';
import { ReferralService } from './referrals.service';

@Module({
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
