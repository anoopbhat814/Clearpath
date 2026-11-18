import { DataTable, StatusBadge, type Column } from '@clearpath/ui';
import { formatDateTime } from '@/lib/format';

export interface AuditRow {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ip: string | null;
  actor: { firstName: string; lastName: string; email: string } | null;
}

const columns: Column<AuditRow>[] = [
  { key: 'at', header: 'When', render: (r) => formatDateTime(r.createdAt) },
  { key: 'actor', header: 'Actor', render: (r) => (r.actor ? `${r.actor.firstName} ${r.actor.lastName}` : 'System') },
  { key: 'action', header: 'Action', render: (r) => <StatusBadge tone={r.action === 'DELETE' ? 'danger' : r.action === 'READ' ? 'neutral' : 'info'}>{r.action}</StatusBadge> },
  { key: 'entity', header: 'Entity', render: (r) => `${r.entityType}${r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ''}` },
  { key: 'ip', header: 'IP', render: (r) => r.ip ?? '—' },
];

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return <DataTable columns={columns} rows={rows} empty="No audit events in this range." />;
}
