'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { canSee, type NavKey } from '@/lib/permissions';

const ITEMS: { key: NavKey; href: string; label: string }[] = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard' },
  { key: 'referrals', href: '/referrals', label: 'Referrals' },
  { key: 'patients', href: '/patients', label: 'Patients' },
  { key: 'authorizations', href: '/authorizations', label: 'Authorizations' },
  { key: 'beds', href: '/beds', label: 'Beds & capacity' },
  { key: 'scheduling', href: '/scheduling', label: 'Scheduling' },
  { key: 'tasks', href: '/tasks', label: 'Task boards' },
  { key: 'providers', href: '/providers', label: 'Provider directory' },
  { key: 'analytics', href: '/analytics', label: 'Analytics' },
  { key: 'audit', href: '/audit', label: 'Audit trail' },
];

export function SideNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  return (
    <nav className="cp-sidenav" aria-label="Primary">
      <p className="cp-brand">Clearpath</p>
      <ul>
        {ITEMS.filter((i) => canSee(user?.role, i.key)).map((i) => (
          <li key={i.key}>
            <Link href={i.href} aria-current={pathname?.startsWith(i.href) ? 'page' : undefined}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
