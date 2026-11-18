'use strict';

const Redis = require('ioredis');
const { loadConfig } = require('./config');
const { createPool } = require('./db');
const { createMailer } = require('./mailer');
const { consume } = require('./queue');
const { createScheduler } = require('./scheduler');
const { createNotificationHandler } = require('./notifications');
const { runReferralReminders } = require('./referral-reminders');
const { runAuthorizationExpiry } = require('./auth-expiry');
const { runCapacitySnapshot } = require('./capacity-snapshot');

async function main() {
  const config = loadConfig();
  const pool = createPool(config.databaseUrl);
  const redis = new Redis(config.redisUrl);
  const blocking = new Redis(config.redisUrl); // BLPOP needs its own connection
  const mailer = createMailer(config.smtp);
  const controller = new AbortController();
  const scheduler = createScheduler();

  const deps = { pool, redis };
  scheduler.every('referral-reminders', 60 * 60_000, () => runReferralReminders(deps));
  scheduler.every('authorization-expiry', 6 * 60 * 60_000, () => runAuthorizationExpiry(deps, { warningDays: config.authExpiryWarningDays }));
  scheduler.every('capacity-snapshot', config.capacitySnapshotIntervalMin * 60_000, () => runCapacitySnapshot(deps));

  const shutdown = async (signal) => {
    console.log(`[worker] ${signal} received, shutting down`);
    controller.abort();
    scheduler.stop();
    await Promise.allSettled([pool.end(), redis.quit(), blocking.quit()]);
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('[worker] started');
  await consume(blocking, 'notifications', createNotificationHandler({ pool, mailer }), {
    maxAttempts: config.maxAttempts,
    signal: controller.signal,
  });
}

main().catch((err) => {
  console.error('[worker] fatal', err);
  process.exit(1);
});
