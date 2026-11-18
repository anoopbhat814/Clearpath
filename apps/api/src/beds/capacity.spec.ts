import { matchBeds, summarizeBeds, surgeLevel } from './capacity';

describe('capacity helpers', () => {
  it('summarizes beds and excludes blocked beds from the rate', () => {
    const beds = [
      { status: 'OCCUPIED' }, { status: 'OCCUPIED' }, { status: 'OCCUPIED' },
      { status: 'AVAILABLE' }, { status: 'CLEANING' }, { status: 'BLOCKED' },
    ] as const;
    const s = summarizeBeds(beds as any);
    expect(s).toMatchObject({ total: 6, occupied: 3, available: 1, cleaning: 1, blocked: 1 });
    expect(s.occupancyRate).toBe(0.6);
    expect(s.level).toBe('normal');
  });

  it('handles empty wards', () => {
    expect(summarizeBeds([]).occupancyRate).toBe(0);
  });

  it('maps rates to surge levels', () => {
    expect(surgeLevel(0.5)).toBe('normal');
    expect(surgeLevel(0.8)).toBe('elevated');
    expect(surgeLevel(0.9)).toBe('high');
    expect(surgeLevel(0.97)).toBe('critical');
  });

  it('matches only available beds with the required features', () => {
    const beds = [
      { id: 1, status: 'AVAILABLE', isolation: true, telemetry: false },
      { id: 2, status: 'AVAILABLE', isolation: false, telemetry: true },
      { id: 3, status: 'OCCUPIED', isolation: true, telemetry: true },
    ] as any[];
    expect(matchBeds(beds, { isolation: true }).map((b) => b.id)).toEqual([1]);
    expect(matchBeds(beds, {}).map((b) => b.id)).toEqual([1, 2]);
  });
});
