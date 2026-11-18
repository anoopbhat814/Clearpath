import type { ReactNode } from 'react';
import { SideNav } from '@/components/SideNav';
import { TopBar } from '@/components/TopBar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cp-shell">
      <SideNav />
      <main className="cp-main">
        <TopBar />
        {children}
      </main>
    </div>
  );
}
