'use strict';

const { buildDigests, isOverdue } = require('./referral-reminders');

const now = new Date('2026-06-10T12:00:00Z');
const hoursAgo = (h) => new Date(now.getTime() - h * 3_600_000).toISOString();

describe('referral reminders', () => {
  it('uses per-priority triage targets', () => {
    expect(isOverdue({ priority: 'EMERGENT', createdAt: hoursAgo(3) }, now)).toBe(true);
    expect(isOverdue({ priority: 'URGENT', createdAt: hoursAgo(3) }, now)).toBe(false);
    expect(isOverdue({ priority: 'ROUTINE', createdAt: hoursAgo(80) }, now)).toBe(true);
  });

  it('returns no digests when nothing is overdue', () => {
    expect(buildDigests([{ reference: 'REF-1', priority: 'ROUTINE', createdAt: hoursAgo(1) }], [{ id: 'u1', email: 'a@clearpath.example' }], now)).toEqual([]);
  });

  it('builds one digest per coordinator, most urgent first', () => {
    const digests = buildDigests(
      [
        { reference: 'REF-ROUTINE', priority: 'ROUTINE', createdAt: hoursAgo(100) },
        { reference: 'REF-EMERGENT', priority: 'EMERGENT', createdAt: hoursAgo(10) },
      ],
      [{ id: 'u1', email: 'a@clearpath.example' }, { id: 'u2', email: 'b@clearpath.example' }],
      now,
    );
    expect(digests).toHaveLength(2);
    expect(digests[0].title).toBe('2 referrals past the triage target');
    expect(digests[0].body.startsWith('REF-EMERGENT')).toBe(true);
  });

  it('truncates long digests', () => {
    const many = Array.from({ length: 14 }, (_, i) => ({ reference: `REF-${i}`, priority: 'ROUTINE', createdAt: hoursAgo(100) }));
    const [digest] = buildDigests(many, [{ id: 'u1', email: 'a@clearpath.example' }], now);
    expect(digest.body).toMatch(/and 4 more$/);
  });
});
