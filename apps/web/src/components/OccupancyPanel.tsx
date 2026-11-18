'use client';

import { OccupancyGauge, StatusBadge } from '@clearpath/ui';
import type { WardOccupancy } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';
import { QueryBoundary } from './QueryBoundary';
import { titleCase } from '@/lib/format';

export function OccupancyPanel({ facilityId }: { facilityId?: string }) {
  const state = useApi<WardOccupancy[]>('/wards/overview/occupancy', { facilityId });
  usePolling(state.reload);
  return (
    <QueryBoundary state={state}>
      {(wards) => (
        <div className="cp-grid">
          {wards.map((w) => (
            <article key={w.wardId} className="cp-card">
              <h3>{w.name} <StatusBadge tone="neutral">{titleCase(w.type)}</StatusBadge></h3>
              <OccupancyGauge rate={w.occupancyRate} level={w.level} label={`${w.name} occupancy`} />
              <p className="cp-muted">{w.occupied} occupied · {w.available} available · {w.cleaning} cleaning · {w.blocked} blocked</p>
            </article>
          ))}
        </div>
      )}
    </QueryBoundary>
  );
}
