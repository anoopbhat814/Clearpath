import type { UserRole } from '@clearpath/shared-types';

export type NavKey = 'dashboard' | 'referrals' | 'patients' | 'authorizations' | 'beds' | 'scheduling' | 'tasks' | 'providers' | 'analytics' | 'audit';

const ALL: UserRole[] = ['ADMIN', 'COORDINATOR', 'CLINICIAN', 'SCHEDULER', 'BED_MANAGER', 'ANALYST', 'AUDITOR'];

/** Which roles see which navigation entries. The API remains the source of truth. */
export const NAV_ACCESS: Record<NavKey, UserRole[]> = {
  dashboard: ALL,
  referrals: ['ADMIN', 'COORDINATOR', 'CLINICIAN', 'SCHEDULER'],
  patients: ['ADMIN', 'COORDINATOR', 'CLINICIAN', 'SCHEDULER', 'BED_MANAGER'],
  authorizations: ['ADMIN', 'COORDINATOR', 'CLINICIAN'],
  beds: ['ADMIN', 'BED_MANAGER', 'COORDINATOR', 'CLINICIAN'],
  scheduling: ['ADMIN', 'SCHEDULER'],
  tasks: ['ADMIN', 'COORDINATOR', 'CLINICIAN', 'SCHEDULER', 'BED_MANAGER'],
  providers: ALL,
  analytics: ['ADMIN', 'ANALYST', 'COORDINATOR', 'BED_MANAGER'],
  audit: ['ADMIN', 'AUDITOR'],
};

export function canSee(role: UserRole | undefined, key: NavKey): boolean {
  return !!role && NAV_ACCESS[key].includes(role);
}
