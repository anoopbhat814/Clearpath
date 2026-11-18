export interface AppConfig {
  port: number;
  jwt: { accessSecret: string; refreshSecret: string; accessTtl: string; refreshTtlDays: number };
  bcryptRounds: number;
  redisUrl: string;
  analyticsUrl: string;
  auditGatewayUrl: string | null;
  auditGatewayKey: string | null;
}

export default (): AppConfig => ({
  port: Number(process.env.API_PORT ?? 4000),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 14),
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  analyticsUrl: process.env.ANALYTICS_URL ?? 'http://localhost:8100',
  auditGatewayUrl: process.env.AUDIT_GATEWAY_URL ?? null,
  auditGatewayKey: process.env.AUDIT_GATEWAY_SIGNING_KEY ?? null,
});
