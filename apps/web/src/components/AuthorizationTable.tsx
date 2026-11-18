import { DataTable, StatusBadge, toneForStatus, type Column } from '@clearpath/ui';
import type { AuthorizationSummary } from '@clearpath/shared-types';
import { formatDate, titleCase } from '@/lib/format';

const columns: Column<AuthorizationSummary>[] = [
  { key: 'ref', header: 'Reference', render: (a) => a.reference },
  { key: 'service', header: 'Service', render: (a) => `${a.serviceCode} · ${a.serviceDescription}` },
  { key: 'units', header: 'Units', align: 'right', render: (a) => a.units },
  { key: 'status', header: 'Status', render: (a) => <StatusBadge tone={toneForStatus(a.status)}>{titleCase(a.status)}</StatusBadge> },
  { key: 'valid', header: 'Valid until', render: (a) => formatDate(a.validUntil) },
  { key: 'reason', header: 'Denial reason', render: (a) => a.denialReason ?? '—' },
];

export function AuthorizationTable({ rows }: { rows: AuthorizationSummary[] }) {
  return <DataTable columns={columns} rows={rows} empty="No authorizations found." />;
}
