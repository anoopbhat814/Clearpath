'use client';

import type { Page } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { QueryBoundary } from '@/components/QueryBoundary';

interface Notice { id: string; kind: string; title: string; body: string | null; readAt: string | null; createdAt: string }

export default function NotificationsPage() {
  const state = useApi<Page<Notice>>('/notifications', { pageSize: 50 });
  return (
    <>
      <PageHeader
        title="Notifications"
        actions={<button className="cp-btn cp-btn--ghost" onClick={async () => { await api.post('/notifications/read-all'); state.reload(); }}>Mark all read</button>}
      />
      <QueryBoundary state={state}>
        {(page) =>
          page.items.length === 0 ? (
            <EmptyState title="You are all caught up">New referral, authorization and task alerts appear here.</EmptyState>
          ) : (
            <ul>
              {page.items.map((n) => (
                <li key={n.id} style={{ fontWeight: n.readAt ? 400 : 700 }}>
                  {n.title} <span className="cp-muted">{formatDateTime(n.createdAt)}</span>
                  {n.body && <p className="cp-muted">{n.body}</p>}
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </>
  );
}
