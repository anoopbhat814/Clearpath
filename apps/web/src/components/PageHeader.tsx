import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="cp-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="cp-muted">{subtitle}</p>}
      </div>
      {actions && <div className="cp-page-header__actions">{actions}</div>}
    </header>
  );
}
