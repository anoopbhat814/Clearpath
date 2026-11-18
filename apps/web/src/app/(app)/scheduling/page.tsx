'use client';

import { useMemo, useState } from 'react';
import type { Page } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { PageHeader } from '@/components/PageHeader';
import { QueryBoundary } from '@/components/QueryBoundary';
import { ShiftWeek, type ShiftRow } from '@/components/ShiftWeek';
import { addDays } from '@clearpath/shared-utils';

function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

export default function SchedulingPage() {
  const [offset, setOffset] = useState(0);
  const start = useMemo(() => addDays(mondayOf(new Date()), offset * 7), [offset]);
  const state = useApi<Page<ShiftRow>>('/shifts', { from: start.toISOString(), to: addDays(start, 7).toISOString(), pageSize: 100 });
  return (
    <>
      <PageHeader
        title="Staff scheduling"
        subtitle={`Week of ${start.toISOString().slice(0, 10)}`}
        actions={
          <>
            <button className="cp-btn cp-btn--ghost" onClick={() => setOffset(offset - 1)}>Previous week</button>
            <button className="cp-btn cp-btn--ghost" onClick={() => setOffset(0)}>This week</button>
            <button className="cp-btn cp-btn--ghost" onClick={() => setOffset(offset + 1)}>Next week</button>
          </>
        }
      />
      <QueryBoundary state={state}>{(page) => <ShiftWeek shifts={page.items} />}</QueryBoundary>
    </>
  );
}
