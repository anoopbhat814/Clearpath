'use client';

import { useState } from 'react';
import type { ReferralStatus } from '@clearpath/shared-types';
import { api } from '@/lib/api';
import { titleCase } from '@/lib/format';

const NEXT: Record<ReferralStatus, ReferralStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['TRIAGED', 'DECLINED', 'CANCELLED'],
  TRIAGED: ['SCHEDULED', 'DECLINED', 'CANCELLED'],
  SCHEDULED: ['COMPLETED', 'TRIAGED', 'CANCELLED'],
  COMPLETED: [],
  DECLINED: [],
  CANCELLED: [],
};

export function TransitionPanel({ id, status, onChanged }: { id: string; status: ReferralStatus; onChanged: () => void }) {
  const [busy, setBusy] = useState<ReferralStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const options = NEXT[status];

  async function go(to: ReferralStatus) {
    setBusy(to);
    setError(null);
    try {
      await api.post(`/referrals/${id}/transition`, { status: to, scheduledAt: to === 'SCHEDULED' ? new Date(scheduledAt).toISOString() : undefined });
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (options.length === 0) return <p className="cp-muted">This referral is closed.</p>;
  return (
    <div className="cp-panel">
      <h3>Move referral</h3>
      {status === 'TRIAGED' && (
        <label>
          Appointment time
          <input className="cp-input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </label>
      )}
      <div className="cp-row">
        {options.map((to) => (
          <button key={to} className="cp-btn" disabled={busy !== null || (to === 'SCHEDULED' && !scheduledAt)} onClick={() => go(to)}>
            {busy === to ? 'Saving…' : titleCase(to)}
          </button>
        ))}
      </div>
      {error && <p className="cp-alert cp-alert--danger" role="alert">{error}</p>}
    </div>
  );
}
