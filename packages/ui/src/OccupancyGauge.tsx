import type { SurgeLevel } from '@clearpath/shared-types';

const COLORS: Record<SurgeLevel, string> = {
  normal: 'var(--cp-green)',
  elevated: 'var(--cp-yellow)',
  high: 'var(--cp-orange)',
  critical: 'var(--cp-red)',
};

export function OccupancyGauge({ rate, level, label }: { rate: number; level: SurgeLevel; label?: string }) {
  const pct = Math.round(Math.min(Math.max(rate, 0), 1) * 100);
  return (
    <div className="cp-gauge" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Occupancy'}>
      <div className="cp-gauge__bar" style={{ width: `${pct}%`, background: COLORS[level] }} />
      <span className="cp-gauge__text">{pct}%</span>
    </div>
  );
}
