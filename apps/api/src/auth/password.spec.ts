import { assertPasswordStrength, hashPassword, verifyPassword } from './password';

describe('password helpers', () => {
  it('rejects weak passwords with every problem listed', () => {
    expect(() => assertPasswordStrength('short')).toThrow(/12 characters.*uppercase.*digit/);
  });

  it('accepts a strong password', () => {
    expect(() => assertPasswordStrength('Correct-Horse-Battery-9')).not.toThrow();
  });

  it('round-trips hash and verify', async () => {
    const hash = await hashPassword('Correct-Horse-Battery-9', 4);
    await expect(verifyPassword('Correct-Horse-Battery-9', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});
