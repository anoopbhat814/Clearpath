'use client';

import { useState } from 'react';
import type { Page } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { FilterBar } from '@/components/FilterBar';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { ProviderCard, type ProviderRow } from '@/components/ProviderCard';
import { QueryBoundary } from '@/components/QueryBoundary';

export default function ProvidersPage() {
  const [q, setQ] = useState('');
  const [network, setNetwork] = useState('');
  const [specialtyCode, setSpecialtyCode] = useState('');
  const debounced = useDebounce(q);
  const { page, pageSize, setPage, reset } = usePagination(12);
  const specialties = useApi<Page<{ id: string; code: string; name: string }>>('/specialties', { pageSize: 100 });
  const state = useApi<Page<ProviderRow>>('/providers', { q: debounced, networkStatus: network, specialtyCode, acceptingNew: undefined, page, pageSize });
  return (
    <>
      <PageHeader title="Provider directory" subtitle="Find in-network clinicians accepting new patients" />
      <FilterBar
        query={q}
        onQuery={(v) => { setQ(v); reset(); }}
        hint="Name or NPI"
        selects={[
          { name: 'network', label: 'Network', value: network, onChange: (v) => { setNetwork(v); reset(); }, options: [{ value: 'IN_NETWORK', label: 'In network' }, { value: 'OUT_OF_NETWORK', label: 'Out of network' }, { value: 'PENDING', label: 'Pending' }] },
          { name: 'specialty', label: 'Specialty', value: specialtyCode, onChange: (v) => { setSpecialtyCode(v); reset(); }, options: (specialties.data?.items ?? []).map((s) => ({ value: s.code, label: s.name })) },
        ]}
      />
      <QueryBoundary state={state}>
        {(data) => (
          <>
            <div className="cp-grid">{data.items.map((p) => (<ProviderCard key={p.id} provider={p} />))}</div>
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </QueryBoundary>
    </>
  );
}
