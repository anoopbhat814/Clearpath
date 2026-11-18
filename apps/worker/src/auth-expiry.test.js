'use strict';

const { daysRemaining, runAuthorizationExpiry, warningBucket } = require('./auth-expiry');

describe('authorization expiry', () => {
  const now = new Date('2026-06-10T00:00:00Z');

  it('counts whole days remaining, rounding up', () => {
    expect(daysRemaining('2026-06-12T00:00:00Z', now)).toBe(2);
    expect(daysRemaining('2026-06-10T06:00:00Z', now)).toBe(1);
    expect(daysRemaining('2026-06-09T00:00:00Z', now)).toBe(-1);
  });

  it('maps remaining days to warning buckets', () => {
    expect(warningBucket(-1, 7)).toBe('expired');
    expect(warningBucket(1, 7)).toBe('final');
    expect(warningBucket(5, 7)).toBe('warning');
    expect(warningBucket(30, 7)).toBeNull();
  });

  it('expires lapsed approvals and notifies once per bucket', async () => {
    const queries = [];
    const pool = {
      query: async (sql, params) => {
        queries.push(sql);
        if (sql.includes('FROM prior_authorizations')) {
          return { rows: [{ id: 'a1', reference: 'PA-2026-AAA', validUntil: '2026-06-09T00:00:00Z', requestedById: 'u1', email: 'u1@clearpath.example' }] };
        }
        return { rows: [] };
      },
    };
    const seen = new Set();
    const pushed = [];
    const redis = {
      set: async (key) => (seen.has(key) ? null : (seen.add(key), 'OK')),
      rpush: async (_q, payload) => pushed.push(JSON.parse(payload)),
    };
    expect(await runAuthorizationExpiry({ pool, redis }, { warningDays: 7 }, now)).toBe(1);
    expect(await runAuthorizationExpiry({ pool, redis }, { warningDays: 7 }, now)).toBe(0);
    expect(pushed).toHaveLength(1);
    expect(pushed[0].kind).toBe('authorization.expired');
    expect(queries.some((q) => q.includes("SET status = 'EXPIRED'"))).toBe(true);
  });
});
