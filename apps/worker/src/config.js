'use strict';

const int = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

function loadConfig(env = process.env) {
  return {
    databaseUrl: env.DATABASE_URL || 'postgresql://clearpath:clearpath@localhost:5432/clearpath',
    redisUrl: env.REDIS_URL || 'redis://localhost:6379',
    smtp: {
      host: env.SMTP_HOST || 'localhost',
      port: int(env.SMTP_PORT, 1025),
      from: env.SMTP_FROM || 'care-ops@clearpath.example',
    },
    reminderLeadHours: int(env.REMINDER_LEAD_HOURS, 48),
    authExpiryWarningDays: int(env.AUTH_EXPIRY_WARNING_DAYS, 7),
    capacitySnapshotIntervalMin: int(env.CAPACITY_SNAPSHOT_INTERVAL_MIN, 15),
    maxAttempts: int(env.JOB_MAX_ATTEMPTS, 4),
  };
}

module.exports = { loadConfig, int };
