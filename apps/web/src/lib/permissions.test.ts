import { canSee } from './permissions';

describe('navigation permissions', () => {
  it('hides the audit trail from coordinators', () => {
    expect(canSee('COORDINATOR', 'audit')).toBe(false);
    expect(canSee('AUDITOR', 'audit')).toBe(true);
  });

  it('shows scheduling to schedulers and admins only', () => {
    expect(canSee('SCHEDULER', 'scheduling')).toBe(true);
    expect(canSee('ADMIN', 'scheduling')).toBe(true);
    expect(canSee('CLINICIAN', 'scheduling')).toBe(false);
  });

  it('shows nothing without a role', () => {
    expect(canSee(undefined, 'dashboard')).toBe(false);
  });
});
