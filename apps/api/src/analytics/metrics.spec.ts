import { ageInYears, hoursBetween, median, percentile, rate } from './metrics';

describe('analytics metrics', () => {
  it('computes medians for odd and even samples', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('computes nearest-rank percentiles', () => {
    const v = [15, 20, 35, 40, 50];
    expect(percentile(v, 50)).toBe(35);
    expect(percentile(v, 90)).toBe(50);
    expect(percentile([], 90)).toBeNull();
  });

  it('computes safe rates', () => {
    expect(rate(1, 3)).toBe(0.333);
    expect(rate(5, 0)).toBe(0);
  });

  it('measures elapsed hours to one decimal', () => {
    expect(hoursBetween(new Date('2026-01-01T00:00Z'), new Date('2026-01-01T05:30Z'))).toBe(5.5);
  });

  it('computes age with birthday handling', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    expect(ageInYears(new Date('1980-06-16T00:00:00Z'), now)).toBe(45);
    expect(ageInYears(new Date('1980-06-15T00:00:00Z'), now)).toBe(46);
  });
});
