'use client';

import { useState } from 'react';
import type { Page } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { usePagination } from '@/hooks/usePagination';
import { AuditTable, type AuditRow } from '@/components/AuditTable';
import { FilterBar } from '@/components/FilterBar';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { QueryBoundary } from '@/components/QueryBoundary';
import { API_BASE } from '@/lib/constants';
import { readTokens } from '@/lib/auth-storage';

const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'];

export default function AuditPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const { page, pageSize, setPage, reset } = usePagination(50);
  const state = useApi<Page<AuditRow>>('/audit', { action, entityType, page, pageSize });

  async function download() {
    const res = await fetch(`${API_BASE}/audit/export`, { headers: { authorization: `Bearer ${readTokens()?.accessToken ?? ''}` } });
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Audit trail" subtitle="Who accessed or changed what, and when" actions={<button className="cp-btn" onClick={download}>Export CSV</button>} />
      <FilterBar
        query={entityType}
        onQuery={(v) => { setEntityType(v); reset(); }}
        hint="Entity type, e.g. Patient"
        selects={[{ name: 'action', label: 'Action', value: action, onChange: (v) => { setAction(v); reset(); }, options: ACTIONS.map((a) => ({ value: a, label: a.charAt(0) + a.slice(1).toLowerCase() })) }]}
      />
      <QueryBoundary state={state}>
        {(data) => (
          <>
            <AuditTable rows={data.items} />
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </QueryBoundary>
    </>
  );
}
