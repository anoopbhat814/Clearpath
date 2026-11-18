'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ReferralSummary } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { FilterBar } from '@/components/FilterBar';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { QueryBoundary } from '@/components/QueryBoundary';
import { ReferralTable } from '@/components/ReferralTable';
import type { Page } from '@clearpath/shared-types';

const STATUSES = ['DRAFT', 'SUBMITTED', 'TRIAGED', 'SCHEDULED', 'COMPLETED', 'DECLINED', 'CANCELLED'];
const PRIORITIES = ['ROUTINE', 'URGENT', 'EMERGENT'];

export default function ReferralsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const debounced = useDebounce(q);
  const { page, pageSize, setPage, reset } = usePagination();
  const state = useApi<Page<ReferralSummary>>('/referrals', { q: debounced, status, priority, page, pageSize });

  return (
    <>
      <PageHeader title="Referrals" subtitle="Track every referral from submission to completed visit" actions={<><Link className="cp-btn cp-btn--ghost" href="/referrals?status=SUBMITTED">Triage queue</Link><Link className="cp-btn" href="/referrals/new">New referral</Link></>} />
      <FilterBar
        query={q}
        onQuery={(v) => { setQ(v); reset(); }}
        hint="Search by reference or reason"
        selects={[
          { name: 'status', label: 'Status', value: status, onChange: (v) => { setStatus(v); reset(); }, options: STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })) },
          { name: 'priority', label: 'Priority', value: priority, onChange: (v) => { setPriority(v); reset(); }, options: PRIORITIES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })) },
        ]}
      />
      <QueryBoundary state={state}>
        {(data) => (
          <>
            <ReferralTable rows={data.items} />
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </QueryBoundary>
    </>
  );
}
