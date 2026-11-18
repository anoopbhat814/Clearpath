import { StatusBadge, type Tone } from './StatusBadge';

type Sla = 'met' | 'breached' | 'at_risk' | 'on_track' | 'none';

const MAP: Record<Sla, { tone: Tone; label: string }> = {
  met: { tone: 'success', label: 'SLA met' },
  on_track: { tone: 'info', label: 'On track' },
  at_risk: { tone: 'warning', label: 'At risk' },
  breached: { tone: 'danger', label: 'Breached' },
  none: { tone: 'neutral', label: 'No SLA' },
};

export function SlaChip({ state }: { state: Sla }) {
  const { tone, label } = MAP[state];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
