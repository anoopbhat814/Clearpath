import { assertAuthTransition, classifyExpiry, validateDecision } from './auth-rules';

describe('authorization rules', () => {
  it('follows the payer decision flow', () => {
    expect(() => assertAuthTransition('PENDING', 'SUBMITTED')).not.toThrow();
    expect(() => assertAuthTransition('DENIED', 'APPEALED')).not.toThrow();
    expect(() => assertAuthTransition('PENDING', 'APPROVED')).toThrow();
    expect(() => assertAuthTransition('EXPIRED', 'APPROVED')).toThrow();
  });

  it('classifies expiry windows', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    expect(classifyExpiry(null, now)).toBe('none');
    expect(classifyExpiry(new Date('2026-05-31T00:00:00Z'), now)).toBe('expired');
    expect(classifyExpiry(new Date('2026-06-05T00:00:00Z'), now)).toBe('expiring');
    expect(classifyExpiry(new Date('2026-07-01T00:00:00Z'), now)).toBe('valid');
  });

  it('requires reasons and validity on decisions', () => {
    expect(() => validateDecision('DENIED', {})).toThrow(/reason/);
    expect(() => validateDecision('DENIED', { denialReason: 'Not medically necessary' })).not.toThrow();
    expect(() => validateDecision('APPROVED', {})).toThrow(/validUntil/);
  });
});
