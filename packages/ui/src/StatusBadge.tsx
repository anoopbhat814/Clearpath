import type { ReactNode } from 'react';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'cp-badge cp-badge--neutral',
  info: 'cp-badge cp-badge--info',
  success: 'cp-badge cp-badge--success',
  warning: 'cp-badge cp-badge--warning',
  danger: 'cp-badge cp-badge--danger',
};

export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={TONE_CLASS[tone]}>{children}</span>;
}

export function toneForStatus(status: string): Tone {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'DONE':
    case 'AVAILABLE':
      return 'success';
    case 'DENIED':
    case 'DECLINED':
    case 'EXPIRED':
    case 'BLOCKED':
    case 'EMERGENT':
    case 'CRITICAL':
      return 'danger';
    case 'URGENT':
    case 'HIGH':
    case 'CLEANING':
    case 'APPEALED':
      return 'warning';
    case 'SUBMITTED':
    case 'TRIAGED':
    case 'SCHEDULED':
    case 'IN_PROGRESS':
      return 'info';
    default:
      return 'neutral';
  }
}
