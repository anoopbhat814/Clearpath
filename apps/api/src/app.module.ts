import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { CommonModule } from './common/common.module';
import { AuditInterceptor } from './common/audit.interceptor';
import { LoggingInterceptor } from './common/logging.interceptor';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt.guard';
import { RolesGuard } from './auth/roles.guard';
import { HealthModule } from './health/health.module';
import { FacilityModule } from './facilities/facilities.module';
import { UserModule } from './users/users.module';
import { PatientModule } from './patients/patients.module';
import { ProviderModule } from './providers/providers.module';
import { SpecialtyModule } from './specialties/specialties.module';
import { InsurancePlanModule } from './insurance-plans/insurance-plans.module';
import { CoverageModule } from './coverages/coverages.module';
import { ReferralModule } from './referrals/referrals.module';
import { CarePathwayModule } from './pathways/pathways.module';
import { PriorAuthorizationModule } from './authorizations/authorizations.module';
import { WardModule } from './wards/wards.module';
import { BedModule } from './beds/beds.module';
import { StaffMemberModule } from './staff/staff.module';
import { ShiftModule } from './shifts/shifts.module';
import { TaskBoardModule } from './task-boards/task-boards.module';
import { TaskModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    CommonModule,
    AuthModule,
    HealthModule,
    FacilityModule,
    UserModule,
    PatientModule,
    ProviderModule,
    SpecialtyModule,
    InsurancePlanModule,
    CoverageModule,
    ReferralModule,
    CarePathwayModule,
    PriorAuthorizationModule,
    WardModule,
    BedModule,
    StaffMemberModule,
    ShiftModule,
    TaskBoardModule,
    TaskModule,
    NotificationsModule,
    AuditModule,
    AnalyticsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
