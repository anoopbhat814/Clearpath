import { defaultDueAt, slaState } from './sla';

const created = new Date('2026-05-01T00:00:00Z');
const due = new Date('2026-05-01T08:00:00Z');

describe('task SLA', () => {
  it('has no state without a due date', () => {
    expect(slaState({ status: 'OPEN', dueAt: null, completedAt: null, createdAt: created })).toBe('none');
  });

  it('is on track early in the window and at risk near the end', () => {
    const base = { status: 'OPEN' as const, dueAt: due, completedAt: null, createdAt: created };
    expect(slaState(base, new Date('2026-05-01T01:00:00Z'))).toBe('on_track');
    expect(slaState(base, new Date('2026-05-01T07:00:00Z'))).toBe('at_risk');
    expect(slaState(base, new Date('2026-05-01T09:00:00Z'))).toBe('breached');
  });

  it('judges completed tasks by completion time', () => {
    const done = { status: 'DONE' as const, dueAt: due, createdAt: created };
    expect(slaState({ ...done, completedAt: new Date('2026-05-01T06:00:00Z') })).toBe('met');
    expect(slaState({ ...done, completedAt: new Date('2026-05-01T10:00:00Z') })).toBe('breached');
  });

  it('picks the shorter of board SLA and priority target', () => {
    const from = new Date('2026-05-01T00:00:00Z');
    expect(defaultDueAt('CRITICAL', 24, from).toISOString()).toBe('2026-05-01T04:00:00.000Z');
    expect(defaultDueAt('LOW', 24, from).toISOString()).toBe('2026-05-02T00:00:00.000Z');
  });
});
