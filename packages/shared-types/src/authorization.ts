export type AuthStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'APPEALED';

export interface AuthorizationSummary {
  id: string;
  reference: string;
  status: AuthStatus;
  serviceCode: string;
  serviceDescription: string;
  units: number;
  validUntil: string | null;
  denialReason: string | null;
  createdAt: string;
}
