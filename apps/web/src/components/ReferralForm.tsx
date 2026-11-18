'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import type { Page } from '@clearpath/shared-types';

interface Option { id: string; name?: string; firstName?: string; lastName?: string; mrn?: string }

export function ReferralForm() {
  const router = useRouter();
  const specialties = useApi<Page<Option>>('/specialties', { pageSize: 100 });
  const [patientQuery, setPatientQuery] = useState('');
  const patients = useApi<Page<Option>>(patientQuery.length >= 2 ? '/patients' : null, { q: patientQuery, pageSize: 8 });
  const [form, setForm] = useState({ patientId: '', specialtyId: '', priority: 'ROUTINE', reason: '', clinicalSummary: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await api.post<{ id: string }>('/referrals', { ...form, clinicalSummary: form.clinicalSummary || undefined });
      await api.post(`/referrals/${created.id}/transition`, { status: 'SUBMITTED' });
      router.push(`/referrals/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form className="cp-form" onSubmit={submit}>
      <label>
        Find patient (last name or MRN)
        <input className="cp-input" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
      </label>
      <label>
        Patient
        <select className="cp-input" required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
          <option value="">Select…</option>
          {patients.data?.items.map((p) => (
            <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} ({p.mrn})</option>
          ))}
        </select>
      </label>
      <label>
        Specialty
        <select className="cp-input" required value={form.specialtyId} onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}>
          <option value="">Select…</option>
          {specialties.data?.items.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <label>
        Priority
        <select className="cp-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="ROUTINE">Routine</option>
          <option value="URGENT">Urgent</option>
          <option value="EMERGENT">Emergent</option>
        </select>
      </label>
      <label>
        Reason for referral
        <input className="cp-input" required maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      </label>
      <label>
        Clinical summary
        <textarea className="cp-input" rows={5} value={form.clinicalSummary} onChange={(e) => setForm({ ...form, clinicalSummary: e.target.value })} />
      </label>
      {error && <p className="cp-alert cp-alert--danger" role="alert">{error}</p>}
      <button className="cp-btn" disabled={saving || !form.patientId || !form.specialtyId}>{saving ? 'Submitting…' : 'Submit referral'}</button>
    </form>
  );
}
