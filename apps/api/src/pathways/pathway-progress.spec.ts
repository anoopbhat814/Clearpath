import { nextPosition, progressPercent, stepDueDate } from './pathway-progress';

const steps = [
  { position: 1, dueAfterDays: 2 },
  { position: 2, dueAfterDays: 5 },
  { position: 4, dueAfterDays: 10 },
];

describe('pathway progress', () => {
  it('computes percentages', () => {
    expect(progressPercent(1, 4, false)).toBe(0);
    expect(progressPercent(3, 4, false)).toBe(50);
    expect(progressPercent(3, 4, true)).toBe(100);
    expect(progressPercent(1, 0, false)).toBe(0);
  });

  it('accumulates due dates across steps', () => {
    const start = new Date('2026-02-01T00:00:00Z');
    expect(stepDueDate(start, steps, 2)?.toISOString()).toBe('2026-02-08T00:00:00.000Z');
    expect(stepDueDate(start, steps, 3)).toBeNull();
  });

  it('skips gaps in positions and ends at null', () => {
    expect(nextPosition(2, steps)).toBe(4);
    expect(nextPosition(4, steps)).toBeNull();
  });
});
