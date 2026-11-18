import { Module } from '@nestjs/common';
import { PriorAuthorizationController } from './authorizations.controller';
import { PriorAuthorizationService } from './authorizations.service';

@Module({
  controllers: [PriorAuthorizationController],
  providers: [PriorAuthorizationService],
  exports: [PriorAuthorizationService],
})
export class PriorAuthorizationModule {}
