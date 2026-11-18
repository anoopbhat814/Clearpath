'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import { titleCase } from '@/lib/format';

export function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <div className="cp-topbar">
      <span className="cp-muted">{user ? `${user.firstName} ${user.lastName} · ${titleCase(user.role)}` : ''}</span>
      <div className="cp-topbar__right">
        <NotificationBell />
        <button
          className="cp-btn cp-btn--ghost"
          onClick={async () => {
            await logout();
            router.replace('/login');
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
