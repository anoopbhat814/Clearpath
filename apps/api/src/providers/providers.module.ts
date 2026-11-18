import { Module } from '@nestjs/common';
import { ProviderController } from './providers.controller';
import { ProviderService } from './providers.service';

@Module({
  controllers: [ProviderController],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class ProviderModule {}
