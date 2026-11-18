import { BadRequestException } from '@nestjs/common';
import { ReferralPriority, ReferralStatus } from '@prisma/client';

export const REFERRAL_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['TRIAGED', 'DECLINED', 'CANCELLED'],
  TRIAGED: ['SCHEDULED', 'DECLINED', 'CANCELLED'],
  SCHEDULED: ['COMPLETED', 'TRIAGED', 'CANCELLED'],
  COMPLETED: [],
  DECLINED: [],
  CANCELLED: [],
};

export const TERMINAL_STATUSES: ReferralStatus[] = ['COMPLETED', 'DECLINED', 'CANCELLED'];

export function canTransition(from: ReferralStatus, to: ReferralStatus): boolean {
  return REFERRAL_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: ReferralStatus, to: ReferralStatus): void {
  if (!canTransition(from, to)) {
    const allowed = REFERRAL_TRANSITIONS[from].join(', ') || 'none (terminal)';
    throw new BadRequestException(`Cannot move referral from ${from} to ${to}. Allowed: ${allowed}`);
  }
}

const PRIORITY_WEIGHT: Record<ReferralPriority, number> = { EMERGENT: 3, URGENT: 2, ROUTINE: 1 };

/** Triage order: clinical priority first, then the longest-waiting referral. */
export function compareForTriage(
  a: { priority: ReferralPriority; createdAt: Date },
  b: { priority: ReferralPriority; createdAt: Date },
): number {
  const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  return byPriority !== 0 ? byPriority : a.createdAt.getTime() - b.createdAt.getTime();
}

/** Target hours from submission to triage, by priority. */
export const TRIAGE_TARGET_HOURS: Record<ReferralPriority, number> = { EMERGENT: 2, URGENT: 24, ROUTINE: 72 };

export function triageBreached(
  referral: { priority: ReferralPriority; createdAt: Date; triagedAt: Date | null },
  now = new Date(),
): boolean {
  if (referral.triagedAt) return false;
  const waitedHours = (now.getTime() - referral.createdAt.getTime()) / 3_600_000;
  return waitedHours > TRIAGE_TARGET_HOURS[referral.priority];
}

export function buildReference(now: Date, entropy: string): string {
  const yymm = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `REF-${yymm}-${entropy.toUpperCase().slice(0, 6)}`;
}
