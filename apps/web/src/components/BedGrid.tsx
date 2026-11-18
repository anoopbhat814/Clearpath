'use client';

import { useState } from 'react';
import { StatusBadge, toneForStatus } from '@clearpath/ui';
import type { BedStatus } from '@clearpath/shared-types';
import { api } from '@/lib/api';
import { titleCase } from '@/lib/format';

export interface BedRow {
  id: string;
  label: string;
  status: BedStatus;
  isolation: boolean;
  telemetry: boolean;
}

export function BedGrid({ beds, onChanged }: { beds: BedRow[]; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: BedStatus) {
    setError(null);
    try {
      await api.patch(`/beds/${id}/status`, { status });
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      {error && <p className="cp-alert cp-alert--danger" role="alert">{error}</p>}
      <ul className="cp-bed-grid">
        {beds.map((b) => (
          <li key={b.id} className={`cp-bed cp-bed--${b.status.toLowerCase()}`}>
            <strong>{b.label}</strong>
            <StatusBadge tone={toneForStatus(b.status)}>{titleCase(b.status)}</StatusBadge>
            <span className="cp-muted">{[b.isolation && 'Isolation', b.telemetry && 'Telemetry'].filter(Boolean).join(' · ') || 'Standard'}</span>
            {b.status === 'CLEANING' && <button className="cp-btn cp-btn--ghost" onClick={() => setStatus(b.id, 'AVAILABLE')}>Mark clean</button>}
            {b.status === 'AVAILABLE' && <button className="cp-btn cp-btn--ghost" onClick={() => setStatus(b.id, 'BLOCKED')}>Block</button>}
            {b.status === 'BLOCKED' && <button className="cp-btn cp-btn--ghost" onClick={() => setStatus(b.id, 'AVAILABLE')}>Unblock</button>}
          </li>
        ))}
      </ul>
    </>
  );
}
