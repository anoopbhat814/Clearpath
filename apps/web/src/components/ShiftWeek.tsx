import { formatDateTime } from '@/lib/format';

export interface ShiftRow {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  role: string | null;
  staff: { user: { firstName: string; lastName: string } };
}

/** Groups shifts by calendar day for a simple week view. */
export function groupByDay(shifts: ShiftRow[]): [string, ShiftRow[]][] {
  const map = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const day = s.startsAt.slice(0, 10);
    map.set(day, [...(map.get(day) ?? []), s]);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function ShiftWeek({ shifts }: { shifts: ShiftRow[] }) {
  const days = groupByDay(shifts);
  if (days.length === 0) return <p className="cp-empty">No shifts in this range.</p>;
  return (
    <div className="cp-week">
      {days.map(([day, rows]) => (
        <section key={day} className="cp-week__day">
          <h3>{new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</h3>
          <ul>
            {rows.map((s) => (
              <li key={s.id}>
                <strong>{s.staff.user.lastName}, {s.staff.user.firstName}</strong>
                <span className="cp-muted"> {s.role ?? 'General'} · {formatDateTime(s.startsAt)}–{formatDateTime(s.endsAt).slice(-5)} · {s.status.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
