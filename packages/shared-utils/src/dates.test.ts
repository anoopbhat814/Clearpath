import { addDays, formatDuration, isSameUtcDay, relativeTime } from './dates';

describe('dates', () => {
  const now = new Date('2026-04-10T12:00:00Z');

  it('adds days', () => {
    expect(addDays(now, 3).toISOString()).toBe('2026-04-13T12:00:00.000Z');
  });

  it('compares UTC days', () => {
    expect(isSameUtcDay(new Date('2026-04-10T00:01:00Z'), new Date('2026-04-10T23:59:00Z'))).toBe(true);
    expect(isSameUtcDay(new Date('2026-04-10T23:59:00Z'), new Date('2026-04-11T00:00:00Z'))).toBe(false);
  });

  it('formats relative times in both directions', () => {
    expect(relativeTime(new Date('2026-04-10T15:00:00Z'), now)).toBe('in 3 h');
    expect(relativeTime(new Date('2026-04-08T12:00:00Z'), now)).toBe('2 d ago');
    expect(relativeTime(new Date('2026-04-10T12:10:00Z'), now)).toBe('in 10 min');
  });

  it('formats durations', () => {
    expect(formatDuration(0.5)).toBe('30 min');
    expect(formatDuration(5.55)).toBe('5.6 h');
    expect(formatDuration(72)).toBe('3 d');
  });
});
