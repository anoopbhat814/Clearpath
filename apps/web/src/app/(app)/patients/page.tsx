'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Page } from '@clearpath/shared-types';
import { DataTable, type Column } from '@clearpath/ui';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { FilterBar } from '@/components/FilterBar';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { QueryBoundary } from '@/components/QueryBoundary';
import { formatDate, fullName } from '@/lib/format';

interface PatientRow {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string | null;
  coverages: { plan: { payerName: string } }[];
}

const columns: Column<PatientRow>[] = [
  { key: 'name', header: 'Patient', render: (p) => <Link href={`/patients/${p.id}`}>{fullName(p)}</Link> },
  { key: 'mrn', header: 'MRN', render: (p) => p.mrn },
  { key: 'dob', header: 'Date of birth', render: (p) => formatDate(p.dateOfBirth) },
  { key: 'payer', header: 'Primary payer', render: (p) => p.coverages[0]?.plan.payerName ?? 'Self-pay' },
  { key: 'phone', header: 'Phone', render: (p) => p.phone ?? '—' },
];

export default function PatientsPage() {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q);
  const { page, pageSize, setPage, reset } = usePagination();
  const state = useApi<Page<PatientRow>>('/patients', { q: debounced, page, pageSize });
  return (
    <>
      <PageHeader title="Patients" subtitle="Search by name or medical record number" />
      <FilterBar query={q} onQuery={(v) => { setQ(v); reset(); }} hint="Last name, first name or MRN" />
      <QueryBoundary state={state}>
        {(data) => (
          <>
            <DataTable columns={columns} rows={data.items} empty="No patients found." />
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </QueryBoundary>
    </>
  );
}
