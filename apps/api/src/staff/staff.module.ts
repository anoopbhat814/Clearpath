import { Module } from '@nestjs/common';
import { StaffMemberController } from './staff.controller';
import { StaffMemberService } from './staff.service';

@Module({
  controllers: [StaffMemberController],
  providers: [StaffMemberService],
  exports: [StaffMemberService],
})
export class StaffMemberModule {}
