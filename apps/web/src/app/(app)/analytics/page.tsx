'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/PageHeader';
import { QueryBoundary } from '@/components/QueryBoundary';
import { percent } from '@/lib/format';
import { formatDuration } from '@clearpath/shared-utils';

interface Funnel { total: number; triaged: number; scheduled: number; triageMedianHours: number | null; triageP90Hours: number | null; schedulingRate: number }
interface Outcomes { decided: number; approvalRate: number; turnaroundMedianHours: number | null; turnaroundP90Hours: number | null }

const hours = (v: number | null) => (v === null ? '—' : formatDuration(v));

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const funnel = useApi<Funnel>('/analytics/referral-funnel', { days });
  const outcomes = useApi<Outcomes>('/analytics/authorization-outcomes', { days });
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={`Rolling ${days}-day window`}
        actions={[7, 30, 90].map((d) => (
          <button key={d} className={`cp-btn${d === days ? '' : ' cp-btn--ghost'}`} onClick={() => setDays(d)}>{d} days</button>
        ))}
      />
      <h2>Referral flow</h2>
      <QueryBoundary state={funnel}>
        {(f) => (
          <div className="cp-grid">
            <KpiCard label="Referrals created" value={f.total} />
            <KpiCard label="Median time to triage" value={hours(f.triageMedianHours)} hint={`P90 ${hours(f.triageP90Hours)}`} />
            <KpiCard label="Scheduling rate" value={percent(f.schedulingRate)} hint={`${f.scheduled} of ${f.total} scheduled`} />
          </div>
        )}
      </QueryBoundary>
      <h2>Authorization outcomes</h2>
      <QueryBoundary state={outcomes}>
        {(o) => (
          <div className="cp-grid">
            <KpiCard label="Decisions" value={o.decided} />
            <KpiCard label="Approval rate" value={percent(o.approvalRate)} />
            <KpiCard label="Median payer turnaround" value={hours(o.turnaroundMedianHours)} hint={`P90 ${hours(o.turnaroundP90Hours)}`} />
          </div>
        )}
      </QueryBoundary>
    </>
  );
}
