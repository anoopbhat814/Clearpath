import { BadRequestException } from '@nestjs/common';
import { AuthStatus } from '@prisma/client';

export const AUTH_TRANSITIONS: Record<AuthStatus, AuthStatus[]> = {
  PENDING: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'DENIED'],
  APPROVED: ['EXPIRED'],
  DENIED: ['APPEALED'],
  APPEALED: ['APPROVED', 'DENIED'],
  EXPIRED: [],
};

export function assertAuthTransition(from: AuthStatus, to: AuthStatus): void {
  if (!AUTH_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(`Authorization cannot move from ${from} to ${to}`);
  }
}

export type ExpiryState = 'none' | 'valid' | 'expiring' | 'expired';

export function classifyExpiry(validUntil: Date | null, now = new Date(), warnDays = 7): ExpiryState {
  if (!validUntil) return 'none';
  const msLeft = validUntil.getTime() - now.getTime();
  if (msLeft <= 0) return 'expired';
  return msLeft <= warnDays * 86_400_000 ? 'expiring' : 'valid';
}

/** Denials must carry a reason so appeals have something to respond to. */
export function validateDecision(to: AuthStatus, payload: { denialReason?: string; validUntil?: string }): void {
  if (to === 'DENIED' && !payload.denialReason?.trim()) {
    throw new BadRequestException('A denial reason is required');
  }
  if (to === 'APPROVED' && !payload.validUntil) {
    throw new BadRequestException('An approval requires a validUntil date');
  }
}

export function buildAuthReference(now: Date, entropy: string): string {
  return `PA-${now.getUTCFullYear()}-${entropy.toUpperCase().slice(0, 7)}`;
}
