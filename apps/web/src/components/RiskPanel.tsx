'use client';

import { StatusBadge } from '@clearpath/ui';
import { useApi } from '@/hooks/useApi';
import { percent } from '@/lib/format';

interface Risk {
  score: number;
  band: 'low' | 'moderate' | 'high';
  factors: { name: string; contribution: number }[];
  source: string;
}

export function RiskPanel({ patientId }: { patientId: string }) {
  const { data, loading, error } = useApi<Risk>(`/analytics/patients/${patientId}/risk`);
  if (loading) return <p className="cp-muted">Calculating readmission risk…</p>;
  if (error || !data) return <p className="cp-muted">Risk score is unavailable for your role or right now.</p>;
  return (
    <div className="cp-panel">
      <h3>Readmission risk <StatusBadge tone={data.band === 'high' ? 'danger' : data.band === 'moderate' ? 'warning' : 'success'}>{data.band}</StatusBadge></h3>
      <p className="cp-kpi__value">{percent(data.score)}</p>
      <ul>
        {[...data.factors].sort((a, b) => b.contribution - a.contribution).map((f) => (
          <li key={f.name}>{f.name.replace(/_/g, ' ')}: {percent(f.contribution, 1)}</li>
        ))}
      </ul>
      <p className="cp-muted">Source: {data.source}. Scores support, and never replace, clinical judgment.</p>
    </div>
  );
}
