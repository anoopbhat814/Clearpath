'use client';

import { useState } from 'react';
import type { Page } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';
import { BedGrid, type BedRow } from '@/components/BedGrid';
import { OccupancyPanel } from '@/components/OccupancyPanel';
import { PageHeader } from '@/components/PageHeader';
import { QueryBoundary } from '@/components/QueryBoundary';

interface WardOption { id: string; name: string }

export default function BedsPage() {
  const wards = useApi<Page<WardOption>>('/wards', { pageSize: 100 });
  const [wardId, setWardId] = useState('');
  const beds = useApi<Page<BedRow>>(wardId ? '/beds' : null, { wardId, pageSize: 100 });
  usePolling(beds.reload);
  return (
    <>
      <PageHeader title="Beds and capacity" subtitle="Real-time bed status and surge indicators" />
      <OccupancyPanel />
      <h2>Bed board</h2>
      <QueryBoundary state={wards}>
        {(page) => (
          <label className="cp-select">
            <span className="cp-sr-only">Ward</span>
            <select value={wardId} onChange={(e) => setWardId(e.target.value)}>
              <option value="">Select a ward…</option>
              {page.items.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
            </select>
          </label>
        )}
      </QueryBoundary>
      {wardId && (
        <QueryBoundary state={beds}>
          {(page) => <BedGrid beds={page.items} onChanged={beds.reload} />}
        </QueryBoundary>
      )}
    </>
  );
}
