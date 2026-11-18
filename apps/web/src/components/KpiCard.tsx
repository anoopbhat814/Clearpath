import type { ReactNode } from 'react';

export function KpiCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: 'ok' | 'warn' | 'bad' }) {
  return (
    <section className={`cp-kpi${tone ? ` cp-kpi--${tone}` : ''}`}>
      <p className="cp-kpi__label">{label}</p>
      <p className="cp-kpi__value">{value}</p>
      {hint && <p className="cp-muted">{hint}</p>}
    </section>
  );
}
