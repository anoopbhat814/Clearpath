'use strict';

const MAX_POINTS = 4 * 24 * 14; // two weeks at 15 minute resolution

function summarize(rows) {
  const byWard = new Map();
  for (const r of rows) {
    const w = byWard.get(r.wardId) || { wardId: r.wardId, total: 0, occupied: 0, blocked: 0 };
    w.total += 1;
    if (r.status === 'OCCUPIED') w.occupied += 1;
    if (r.status === 'BLOCKED') w.blocked += 1;
    byWard.set(r.wardId, w);
  }
  return [...byWard.values()].map((w) => ({ ...w, staffed: w.total - w.blocked }));
}

async function runCapacitySnapshot({ pool, redis }, now = new Date()) {
  const { rows } = await pool.query('SELECT "wardId", status FROM beds');
  const summaries = summarize(rows);
  const point = (s) => JSON.stringify({ at: now.toISOString(), occupied: s.occupied, staffed: s.staffed });
  const pipeline = redis.pipeline();
  for (const s of summaries) {
    const key = `capacity:snapshots:${s.wardId}`;
    pipeline.rpush(key, point(s));
    pipeline.ltrim(key, -MAX_POINTS, -1);
  }
  await pipeline.exec();
  return summaries.length;
}

module.exports = { summarize, runCapacitySnapshot, MAX_POINTS };
