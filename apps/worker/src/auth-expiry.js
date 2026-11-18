'use strict';

const DAY = 86_400_000;

function daysRemaining(validUntil, now = new Date()) {
  return Math.ceil((new Date(validUntil).getTime() - now.getTime()) / DAY);
}

/** Warn at the configured horizon and again at 1 day; never warn twice for the same bucket. */
function warningBucket(days, horizon) {
  if (days <= 0) return 'expired';
  if (days <= 1) return 'final';
  if (days <= horizon) return 'warning';
  return null;
}

async function runAuthorizationExpiry({ pool, redis }, { warningDays }, now = new Date()) {
  const { rows } = await pool.query(
    `SELECT a.id, a.reference, a."validUntil", a."requestedById", u.email
       FROM prior_authorizations a JOIN users u ON u.id = a."requestedById"
      WHERE a.status = 'APPROVED' AND a."validUntil" IS NOT NULL AND a."validUntil" <= $1`,
    [new Date(now.getTime() + warningDays * DAY)],
  );
  let queued = 0;
  for (const row of rows) {
    const bucket = warningBucket(daysRemaining(row.validUntil, now), warningDays);
    if (!bucket) continue;
    if (bucket === 'expired') {
      await pool.query(`UPDATE prior_authorizations SET status = 'EXPIRED' WHERE id = $1 AND status = 'APPROVED'`, [row.id]);
      await pool.query(
        `INSERT INTO authorization_events (id, "authorizationId", "fromStatus", "toStatus", note)
         VALUES (gen_random_uuid()::text, $1, 'APPROVED', 'EXPIRED', 'Expired automatically')`,
        [row.id],
      );
    }
    const dedupeKey = `authexpiry:${row.id}:${bucket}`;
    const first = await redis.set(dedupeKey, '1', 'EX', 8 * DAY / 1000, 'NX');
    if (!first) continue;
    await redis.rpush(
      'queue:notifications',
      JSON.stringify({
        userId: row.requestedById,
        email: row.email,
        kind: `authorization.${bucket}`,
        title: bucket === 'expired' ? `Authorization ${row.reference} has expired` : `Authorization ${row.reference} expires soon`,
        body: `Valid until ${new Date(row.validUntil).toISOString().slice(0, 10)}.`,
      }),
    );
    queued += 1;
  }
  return queued;
}

module.exports = { daysRemaining, warningBucket, runAuthorizationExpiry };
