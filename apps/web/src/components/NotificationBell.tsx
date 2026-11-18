'use client';

import Link from 'next/link';
import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';

export function NotificationBell() {
  const { data, reload } = useApi<{ unread: number }>('/notifications/unread-count');
  usePolling(reload, 60_000);
  const unread = data?.unread ?? 0;
  return (
    <Link href="/notifications" className="cp-bell" aria-label={`Notifications, ${unread} unread`}>
      <span aria-hidden>Alerts</span>
      {unread > 0 && <span className="cp-bell__count">{unread > 99 ? '99+' : unread}</span>}
    </Link>
  );
}
