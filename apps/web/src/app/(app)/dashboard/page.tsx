'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { QueryBoundary } from '@/components/QueryBoundary';
import { OccupancyPanel } from '@/components/OccupancyPanel';
import { percent } from '@/lib/format';

interface Overview {
  referrals: Record<string, number>;
  authorizations: Record<string, number>;
  capacity: { occupancyRate: number; available: number; level: string };
  tasks: { open: number; overdue: number };
}

export default function DashboardPage() {
  const state = useApi<Overview>('/analytics/overview');
  usePolling(state.reload);
  return (
    <>
      <PageHeader title="Operations dashboard" subtitle="Live view across referrals, authorizations, capacity and tasks" />
      <QueryBoundary state={state}>
        {(o) => (
          <div className="cp-grid">
            <KpiCard label="Awaiting triage" value={o.referrals.SUBMITTED ?? 0} hint="Submitted referrals" tone={(o.referrals.SUBMITTED ?? 0) > 20 ? 'warn' : 'ok'} />
            <KpiCard label="Scheduled referrals" value={o.referrals.SCHEDULED ?? 0} />
            <KpiCard label="Pending authorizations" value={(o.authorizations.PENDING ?? 0) + (o.authorizations.SUBMITTED ?? 0)} hint={`${o.authorizations.DENIED ?? 0} denied`} />
            <KpiCard label="Bed occupancy" value={percent(o.capacity.occupancyRate)} hint={`${o.capacity.available} beds available`} tone={o.capacity.level === 'critical' ? 'bad' : o.capacity.level === 'high' ? 'warn' : 'ok'} />
            <KpiCard label="Open tasks" value={o.tasks.open} hint={`${o.tasks.overdue} overdue`} tone={o.tasks.overdue > 0 ? 'warn' : 'ok'} />
          </div>
        )}
      </QueryBoundary>
      <h2>Ward capacity</h2>
      <OccupancyPanel />
      <p><Link href="/beds">Open bed management</Link></p>
    </>
  );
}
