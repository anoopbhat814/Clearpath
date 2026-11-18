import type { BedStatus } from '@prisma/client';

export interface OccupancySummary {
  total: number;
  occupied: number;
  available: number;
  cleaning: number;
  blocked: number;
  /** Occupied beds divided by staffed (non-blocked) beds. */
  occupancyRate: number;
  level: SurgeLevel;
}

export type SurgeLevel = 'normal' | 'elevated' | 'high' | 'critical';

export function surgeLevel(rate: number): SurgeLevel {
  if (rate >= 0.95) return 'critical';
  if (rate >= 0.85) return 'high';
  if (rate >= 0.75) return 'elevated';
  return 'normal';
}

export function summarizeBeds(beds: { status: BedStatus }[]): OccupancySummary {
  const count = (s: BedStatus) => beds.filter((b) => b.status === s).length;
  const occupied = count('OCCUPIED');
  const blocked = count('BLOCKED');
  const staffed = beds.length - blocked;
  const occupancyRate = staffed > 0 ? Math.round((occupied / staffed) * 1000) / 1000 : 0;
  return {
    total: beds.length,
    occupied,
    available: count('AVAILABLE'),
    cleaning: count('CLEANING'),
    blocked,
    occupancyRate,
    level: surgeLevel(occupancyRate),
  };
}

/** Isolation or telemetry needs narrow the candidate beds for a patient. */
export function matchBeds<T extends { status: BedStatus; isolation: boolean; telemetry: boolean }>(
  beds: T[],
  needs: { isolation?: boolean; telemetry?: boolean },
): T[] {
  return beds.filter(
    (b) =>
      b.status === 'AVAILABLE' &&
      (!needs.isolation || b.isolation) &&
      (!needs.telemetry || b.telemetry),
  );
}
