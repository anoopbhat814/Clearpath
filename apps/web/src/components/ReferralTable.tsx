import Link from 'next/link';
import { DataTable, StatusBadge, toneForStatus, type Column } from '@clearpath/ui';
import type { ReferralSummary } from '@clearpath/shared-types';
import { formatDate, fullName, titleCase } from '@/lib/format';

const columns: Column<ReferralSummary>[] = [
  { key: 'ref', header: 'Reference', render: (r) => <Link href={`/referrals/${r.id}`}>{r.reference}</Link> },
  { key: 'patient', header: 'Patient', render: (r) => `${fullName(r.patient)} (${r.patient.mrn})` },
  { key: 'specialty', header: 'Specialty', render: (r) => r.specialty.name },
  { key: 'priority', header: 'Priority', render: (r) => <StatusBadge tone={toneForStatus(r.priority)}>{titleCase(r.priority)}</StatusBadge> },
  { key: 'status', header: 'Status', render: (r) => <StatusBadge tone={toneForStatus(r.status)}>{titleCase(r.status)}</StatusBadge> },
  { key: 'created', header: 'Created', render: (r) => formatDate(r.createdAt) },
  { key: 'sla', header: 'Triage SLA', render: (r) => (r.slaBreached ? <StatusBadge tone="danger">Breached</StatusBadge> : '—') },
];

export function ReferralTable({ rows }: { rows: ReferralSummary[] }) {
  return <DataTable columns={columns} rows={rows} empty="No referrals match these filters." />;
}
