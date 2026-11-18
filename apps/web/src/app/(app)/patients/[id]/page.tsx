'use client';

import { useApi } from '@/hooks/useApi';
import { formatDate, formatDateTime, fullName, titleCase } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { QueryBoundary } from '@/components/QueryBoundary';
import { RiskPanel } from '@/components/RiskPanel';

interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  language: string;
  coverages: { id: string; memberId: string; plan: { payerName: string; planName: string } }[];
}
interface TimelineEvent { type: string; id: string; label: string; at: string }

export default function PatientPage({ params }: { params: { id: string } }) {
  const patient = useApi<Patient>(`/patients/${params.id}`);
  const timeline = useApi<TimelineEvent[]>(`/patients/${params.id}/timeline`);
  return (
    <QueryBoundary state={patient}>
      {(p) => (
        <>
          <PageHeader title={fullName(p)} subtitle={`${p.mrn} · born ${formatDate(p.dateOfBirth)} · language ${p.language}`} />
          <div className="cp-grid">
            <section className="cp-panel">
              <h3>Coverage</h3>
              {p.coverages.length === 0 && <p className="cp-muted">No active coverage on file.</p>}
              <ul>
                {p.coverages.map((c) => (
                  <li key={c.id}>{c.plan.payerName} · {c.plan.planName} <span className="cp-muted">(member {c.memberId})</span></li>
                ))}
              </ul>
            </section>
            <RiskPanel patientId={p.id} />
          </div>
          <h2>Timeline</h2>
          <QueryBoundary state={timeline}>
            {(events) => (
              <ul>
                {events.map((e) => (
                  <li key={`${e.type}-${e.id}`}><span className="cp-muted">{formatDateTime(e.at)}</span> · {titleCase(e.type)} · {e.label}</li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </>
      )}
    </QueryBoundary>
  );
}
