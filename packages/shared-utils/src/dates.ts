const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY);
}

export function isSameUtcDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/** Human readable relative time such as "in 3 h" or "2 d ago". */
export function relativeTime(target: Date, now = new Date()): string {
  const diff = target.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const unit = abs >= DAY ? [Math.round(abs / DAY), 'd'] : abs >= HOUR ? [Math.round(abs / HOUR), 'h'] : [Math.max(1, Math.round(abs / MINUTE)), 'min'];
  const text = `${unit[0]} ${unit[1]}`;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  return `${Math.round(hours / 24)} d`;
}
