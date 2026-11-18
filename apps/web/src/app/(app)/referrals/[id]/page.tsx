'use client';

import { useState, type FormEvent } from 'react';
import { StatusBadge, toneForStatus } from '@clearpath/ui';
import type { ReferralStatus } from '@clearpath/shared-types';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { formatDateTime, fullName, titleCase } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { QueryBoundary } from '@/components/QueryBoundary';
import { TransitionPanel } from '@/components/TransitionPanel';

interface ReferralDetail {
  id: string;
  reference: string;
  status: ReferralStatus;
  priority: string;
  reason: string;
  clinicalSummary: string | null;
  scheduledAt: string | null;
  patient: { firstName: string; lastName: string; mrn: string };
  specialty: { name: string };
  provider: { firstName: string; lastName: string } | null;
}

export default function ReferralDetailPage({ params }: { params: { id: string } }) {
  const state = useApi<ReferralDetail>(`/referrals/${params.id}`);
  const [note, setNote] = useState('');

  async function addNote(e: FormEvent) {
    e.preventDefault();
    await api.post(`/referrals/${params.id}/notes`, { body: note });
    setNote('');
  }

  return (
    <QueryBoundary state={state}>
      {(r) => (
        <>
          <PageHeader title={r.reference} subtitle={`${fullName(r.patient)} · ${r.specialty.name}`} actions={<StatusBadge tone={toneForStatus(r.status)}>{titleCase(r.status)}</StatusBadge>} />
          <div className="cp-grid">
            <section className="cp-panel">
              <h3>Details</h3>
              <p><strong>Priority:</strong> {titleCase(r.priority)}</p>
              <p><strong>Reason:</strong> {r.reason}</p>
              <p><strong>Provider:</strong> {r.provider ? `${r.provider.lastName}, ${r.provider.firstName}` : 'Not assigned'}</p>
              <p><strong>Appointment:</strong> {formatDateTime(r.scheduledAt)}</p>
              {r.clinicalSummary && <p className="cp-muted">{r.clinicalSummary}</p>}
            </section>
            <TransitionPanel id={r.id} status={r.status} onChanged={state.reload} />
            <form className="cp-panel cp-form" onSubmit={addNote}>
              <h3>Add internal note</h3>
              <textarea className="cp-input" rows={4} required value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="cp-btn" disabled={!note.trim()}>Save note</button>
            </form>
          </div>
        </>
      )}
    </QueryBoundary>
  );
}
