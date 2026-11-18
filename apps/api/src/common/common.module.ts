import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { AuditInterceptor } from './audit.interceptor';
import { AuditForwarder } from './audit-forwarder.service';

@Global()
@Module({
  providers: [PrismaService, RedisService, AuditInterceptor, AuditForwarder],
  exports: [PrismaService, RedisService, AuditInterceptor, AuditForwarder],
})
export class CommonModule {}
