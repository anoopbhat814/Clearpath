'use client';

import { useState } from 'react';
import type { AuthorizationSummary, Page } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { usePagination } from '@/hooks/usePagination';
import { AuthorizationTable } from '@/components/AuthorizationTable';
import { FilterBar } from '@/components/FilterBar';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { QueryBoundary } from '@/components/QueryBoundary';
import { formatDate } from '@/lib/format';

const STATUSES = ['PENDING', 'SUBMITTED', 'APPROVED', 'DENIED', 'APPEALED', 'EXPIRED'];

export default function AuthorizationsPage() {
  const [status, setStatus] = useState('');
  const { page, pageSize, setPage, reset } = usePagination();
  const state = useApi<Page<AuthorizationSummary>>('/authorizations', { status, page, pageSize });
  const expiring = useApi<AuthorizationSummary[]>('/authorizations/expiring', { days: 14 });
  return (
    <>
      <PageHeader title="Prior authorizations" subtitle="Requests, payer decisions and upcoming expirations" />
      <QueryBoundary state={expiring}>
        {(rows) =>
          rows.length > 0 ? (
            <div className="cp-alert cp-alert--danger" role="status">
              {rows.length} approved authorization{rows.length === 1 ? '' : 's'} expire within 14 days; the next on {formatDate(rows[0].validUntil)}.
            </div>
          ) : (
            <></>
          )
        }
      </QueryBoundary>
      <FilterBar
        query=""
        onQuery={() => undefined}
        hint="Filter"
        selects={[{ name: 'status', label: 'Status', value: status, onChange: (v) => { setStatus(v); reset(); }, options: STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })) }]}
      />
      <QueryBoundary state={state}>
        {(data) => (
          <>
            <AuthorizationTable rows={data.items} />
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </QueryBoundary>
    </>
  );
}
