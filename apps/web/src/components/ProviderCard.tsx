import { StatusBadge } from '@clearpath/ui';
import { titleCase } from '@/lib/format';

export interface ProviderRow {
  id: string;
  npi: string;
  firstName: string;
  lastName: string;
  credentials: string | null;
  networkStatus: string;
  acceptingNew: boolean;
  facility: { name: string } | null;
  specialties: { primary: boolean; specialty: { name: string } }[];
}

export function ProviderCard({ provider }: { provider: ProviderRow }) {
  return (
    <article className="cp-card">
      <h3>{provider.lastName}, {provider.firstName}{provider.credentials ? `, ${provider.credentials}` : ''}</h3>
      <p className="cp-muted">{provider.specialties.map((s) => s.specialty.name).join(', ') || 'No specialty listed'}</p>
      <p className="cp-muted">{provider.facility?.name ?? 'Independent'} · NPI {provider.npi}</p>
      <div className="cp-row">
        <StatusBadge tone={provider.networkStatus === 'IN_NETWORK' ? 'success' : provider.networkStatus === 'PENDING' ? 'warning' : 'neutral'}>
          {titleCase(provider.networkStatus)}
        </StatusBadge>
        <StatusBadge tone={provider.acceptingNew ? 'info' : 'neutral'}>{provider.acceptingNew ? 'Accepting patients' : 'Not accepting'}</StatusBadge>
      </div>
    </article>
  );
}
