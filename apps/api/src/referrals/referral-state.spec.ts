import { BadRequestException } from '@nestjs/common';
import { assertTransition, buildReference, canTransition, compareForTriage, triageBreached } from './referral-state';

describe('referral state machine', () => {
  it('allows the happy path', () => {
    expect(canTransition('DRAFT', 'SUBMITTED')).toBe(true);
    expect(canTransition('SUBMITTED', 'TRIAGED')).toBe(true);
    expect(canTransition('TRIAGED', 'SCHEDULED')).toBe(true);
    expect(canTransition('SCHEDULED', 'COMPLETED')).toBe(true);
  });

  it('blocks skipping triage and leaving terminal states', () => {
    expect(canTransition('SUBMITTED', 'SCHEDULED')).toBe(false);
    expect(() => assertTransition('COMPLETED', 'DRAFT')).toThrow(BadRequestException);
    expect(() => assertTransition('CANCELLED', 'SUBMITTED')).toThrow(/terminal/);
  });

  it('orders the triage queue by priority then age', () => {
    const rows = [
      { id: 'a', priority: 'ROUTINE' as const, createdAt: new Date('2026-01-01') },
      { id: 'b', priority: 'EMERGENT' as const, createdAt: new Date('2026-01-03') },
      { id: 'c', priority: 'URGENT' as const, createdAt: new Date('2026-01-02') },
      { id: 'd', priority: 'URGENT' as const, createdAt: new Date('2026-01-01') },
    ];
    expect(rows.sort(compareForTriage).map((r) => r.id)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('detects triage SLA breaches only for untriaged referrals', () => {
    const created = new Date('2026-03-01T00:00:00Z');
    const now = new Date('2026-03-01T05:00:00Z');
    expect(triageBreached({ priority: 'EMERGENT', createdAt: created, triagedAt: null }, now)).toBe(true);
    expect(triageBreached({ priority: 'URGENT', createdAt: created, triagedAt: null }, now)).toBe(false);
    expect(triageBreached({ priority: 'EMERGENT', createdAt: created, triagedAt: now }, now)).toBe(false);
  });

  it('builds readable references', () => {
    expect(buildReference(new Date('2026-07-09T00:00:00Z'), 'abc123xyz')).toBe('REF-2607-ABC123');
  });
});
