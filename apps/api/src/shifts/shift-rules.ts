export interface TimeRange {
  startsAt: Date;
  endsAt: Date;
}

const HOUR = 3_600_000;

export const hoursBetween = (r: TimeRange) => (r.endsAt.getTime() - r.startsAt.getTime()) / HOUR;

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

export function findConflicts<T extends TimeRange>(candidate: TimeRange, existing: T[]): T[] {
  return existing.filter((s) => overlaps(candidate, s));
}

/** Start of the ISO week (Monday 00:00 UTC) containing the date. */
export function weekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const offset = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d;
}

export function weeklyHours(shifts: TimeRange[], anchor: Date): number {
  const start = weekStart(anchor).getTime();
  const end = start + 7 * 24 * HOUR;
  return shifts
    .filter((s) => s.startsAt.getTime() >= start && s.startsAt.getTime() < end)
    .reduce((sum, s) => sum + hoursBetween(s), 0);
}

export interface ShiftViolation {
  code: 'INVALID_RANGE' | 'TOO_LONG' | 'OVERLAP' | 'WEEKLY_LIMIT' | 'REST_PERIOD';
  message: string;
}

export interface ShiftRuleOptions {
  maxWeeklyHours: number;
  maxShiftHours?: number;
  minRestHours?: number;
}

export function validateShift(candidate: TimeRange, existing: TimeRange[], opts: ShiftRuleOptions): ShiftViolation[] {
  const out: ShiftViolation[] = [];
  const { maxShiftHours = 16, minRestHours = 10 } = opts;
  if (candidate.endsAt <= candidate.startsAt) {
    return [{ code: 'INVALID_RANGE', message: 'Shift must end after it starts' }];
  }
  if (hoursBetween(candidate) > maxShiftHours) {
    out.push({ code: 'TOO_LONG', message: `Shift exceeds ${maxShiftHours} hours` });
  }
  if (findConflicts(candidate, existing).length > 0) {
    out.push({ code: 'OVERLAP', message: 'Shift overlaps an existing shift' });
  }
  const projected = weeklyHours([...existing, candidate], candidate.startsAt);
  if (projected > opts.maxWeeklyHours) {
    out.push({ code: 'WEEKLY_LIMIT', message: `Would reach ${projected}h against a ${opts.maxWeeklyHours}h weekly limit` });
  }
  const tooClose = existing.some((s) => {
    const gapAfter = (candidate.startsAt.getTime() - s.endsAt.getTime()) / HOUR;
    const gapBefore = (s.startsAt.getTime() - candidate.endsAt.getTime()) / HOUR;
    return (gapAfter >= 0 && gapAfter < minRestHours) || (gapBefore >= 0 && gapBefore < minRestHours);
  });
  if (tooClose) out.push({ code: 'REST_PERIOD', message: `Less than ${minRestHours}h rest between shifts` });
  return out;
}
