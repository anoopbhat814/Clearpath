'use strict';

const { runCapacitySnapshot, summarize } = require('./capacity-snapshot');

describe('capacity snapshot', () => {
  const rows = [
    { wardId: 'w1', status: 'OCCUPIED' },
    { wardId: 'w1', status: 'AVAILABLE' },
    { wardId: 'w1', status: 'BLOCKED' },
    { wardId: 'w2', status: 'OCCUPIED' },
  ];

  it('summarizes beds per ward, excluding blocked beds from staffed', () => {
    const [w1, w2] = summarize(rows);
    expect(w1).toMatchObject({ wardId: 'w1', total: 3, occupied: 1, staffed: 2 });
    expect(w2).toMatchObject({ wardId: 'w2', staffed: 1 });
  });

  it('writes one trimmed point per ward', async () => {
    const calls = [];
    const pipeline = { rpush: (...a) => calls.push(['rpush', ...a]), ltrim: (...a) => calls.push(['ltrim', ...a]), exec: async () => [] };
    const redis = { pipeline: () => pipeline };
    const pool = { query: async () => ({ rows }) };
    expect(await runCapacitySnapshot({ pool, redis }, new Date('2026-06-10T00:00:00Z'))).toBe(2);
    expect(calls.filter((c) => c[0] === 'rpush')).toHaveLength(2);
    expect(JSON.parse(calls[0][2])).toMatchObject({ occupied: 1, staffed: 2 });
  });
});
