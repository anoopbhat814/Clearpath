import { findConflicts, overlaps, validateShift, weekStart, weeklyHours } from './shift-rules';

const r = (s: string, e: string) => ({ startsAt: new Date(s), endsAt: new Date(e) });

describe('shift rules', () => {
  it('detects overlaps but not back-to-back shifts', () => {
    expect(overlaps(r('2026-04-06T08:00Z', '2026-04-06T16:00Z'), r('2026-04-06T15:00Z', '2026-04-06T20:00Z'))).toBe(true);
    expect(overlaps(r('2026-04-06T08:00Z', '2026-04-06T16:00Z'), r('2026-04-06T16:00Z', '2026-04-06T20:00Z'))).toBe(false);
  });

  it('finds the conflicting shifts', () => {
    const existing = [r('2026-04-06T08:00Z', '2026-04-06T12:00Z'), r('2026-04-07T08:00Z', '2026-04-07T12:00Z')];
    expect(findConflicts(r('2026-04-06T11:00Z', '2026-04-06T13:00Z'), existing)).toHaveLength(1);
  });

  it('computes the Monday week start', () => {
    expect(weekStart(new Date('2026-04-09T10:00:00Z')).toISOString()).toBe('2026-04-06T00:00:00.000Z');
    expect(weekStart(new Date('2026-04-12T23:00:00Z')).toISOString()).toBe('2026-04-06T00:00:00.000Z');
  });

  it('sums weekly hours inside the week only', () => {
    const shifts = [r('2026-04-06T08:00Z', '2026-04-06T16:00Z'), r('2026-04-13T08:00Z', '2026-04-13T16:00Z')];
    expect(weeklyHours(shifts, new Date('2026-04-08T00:00Z'))).toBe(8);
  });

  it('flags weekly limit and rest period violations', () => {
    const existing = [r('2026-04-06T08:00Z', '2026-04-06T20:00Z')];
    const violations = validateShift(r('2026-04-07T02:00Z', '2026-04-07T10:00Z'), existing, { maxWeeklyHours: 16 });
    expect(violations.map((v) => v.code).sort()).toEqual(['REST_PERIOD', 'WEEKLY_LIMIT']);
  });

  it('rejects inverted ranges and overlong shifts', () => {
    expect(validateShift(r('2026-04-06T10:00Z', '2026-04-06T09:00Z'), [], { maxWeeklyHours: 40 })[0].code).toBe('INVALID_RANGE');
    expect(validateShift(r('2026-04-06T00:00Z', '2026-04-06T20:00Z'), [], { maxWeeklyHours: 40 })[0].code).toBe('TOO_LONG');
  });

  it('accepts a clean shift', () => {
    expect(validateShift(r('2026-04-08T08:00Z', '2026-04-08T16:00Z'), [r('2026-04-06T08:00Z', '2026-04-06T16:00Z')], { maxWeeklyHours: 40 })).toEqual([]);
  });
});
