export type ReferralStatus = 'DRAFT' | 'SUBMITTED' | 'TRIAGED' | 'SCHEDULED' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';
export type ReferralPriority = 'ROUTINE' | 'URGENT' | 'EMERGENT';

export interface ReferralSummary {
  id: string;
  reference: string;
  status: ReferralStatus;
  priority: ReferralPriority;
  reason: string;
  createdAt: string;
  requestedFor: string | null;
  patient: { id: string; mrn: string; firstName: string; lastName: string };
  specialty: { id: string; code: string; name: string };
  slaBreached?: boolean;
}

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  TRIAGED: 'Triaged',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};
