#!/usr/bin/env node
'use strict';

/**
 * Deletes READ-type audit rows older than the retention window in small batches.
 * Mutating events (CREATE/UPDATE/DELETE/EXPORT/LOGIN) are never pruned by this script.
 * Usage: node scripts/prune-audit-logs.js --days 400 [--dry-run]
 */
const { Client } = require('pg');

const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const days = daysIdx >= 0 ? Number(args[daysIdx + 1]) : 400;
const dryRun = args.includes('--dry-run');

if (!Number.isFinite(days) || days < 90) {
  console.error('--days must be a number of at least 90');
  process.exit(2);
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const cutoff = new Date(Date.now() - days * 86_400_000);
  try {
    if (dryRun) {
      const { rows } = await client.query(`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'READ' AND "createdAt" < $1`, [cutoff]);
      console.log(`would delete ${rows[0].n} rows older than ${cutoff.toISOString()}`);
      return;
    }
    let total = 0;
    for (;;) {
      const res = await client.query(
        `DELETE FROM audit_logs WHERE id IN (SELECT id FROM audit_logs WHERE action = 'READ' AND "createdAt" < $1 LIMIT 5000)`,
        [cutoff],
      );
      total += res.rowCount;
      if (res.rowCount < 5000) break;
    }
    console.log(`deleted ${total} rows older than ${cutoff.toISOString()}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
