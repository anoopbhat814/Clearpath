import type { ReactNode } from 'react';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="cp-empty-state">
      <h3>{title}</h3>
      {children && <p className="cp-muted">{children}</p>}
    </div>
  );
}
