'use strict';

/** Target hours from submission to triage; mirrors TRIAGE_TARGET_HOURS in the API. */
const TRIAGE_TARGET_HOURS = { EMERGENT: 2, URGENT: 24, ROUTINE: 72 };

function isOverdue(referral, now = new Date()) {
  const target = TRIAGE_TARGET_HOURS[referral.priority] ?? 72;
  const waitedHours = (now.getTime() - new Date(referral.createdAt).getTime()) / 3_600_000;
  return waitedHours > target;
}

/** Groups overdue referrals per recipient so each coordinator gets a single digest. */
function buildDigests(referrals, coordinators, now = new Date()) {
  const overdue = referrals.filter((r) => isOverdue(r, now));
  if (overdue.length === 0) return [];
  const summary = overdue
    .sort((a, b) => (TRIAGE_TARGET_HOURS[a.priority] ?? 72) - (TRIAGE_TARGET_HOURS[b.priority] ?? 72))
    .map((r) => `${r.reference} (${r.priority.toLowerCase()})`);
  return coordinators.map((c) => ({
    userId: c.id,
    email: c.email,
    kind: 'referral.triage_overdue',
    title: `${overdue.length} referral${overdue.length === 1 ? '' : 's'} past the triage target`,
    body: summary.slice(0, 10).join(', ') + (summary.length > 10 ? `, and ${summary.length - 10} more` : ''),
  }));
}

async function runReferralReminders({ pool, redis }, now = new Date()) {
  const [{ rows: referrals }, { rows: coordinators }] = await Promise.all([
    pool.query(`SELECT reference, priority, "createdAt" FROM referrals WHERE status = 'SUBMITTED'`),
    pool.query(`SELECT id, email FROM users WHERE active = true AND role IN ('COORDINATOR', 'ADMIN')`),
  ]);
  const digests = buildDigests(referrals, coordinators, now);
  for (const d of digests) {
    await redis.rpush('queue:notifications', JSON.stringify(d));
  }
  return digests.length;
}

module.exports = { isOverdue, buildDigests, runReferralReminders, TRIAGE_TARGET_HOURS };
