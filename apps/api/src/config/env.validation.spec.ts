import { validateEnv } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://x',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('accepts a complete environment', () => {
    expect(validateEnv(base)).toBe(base);
  });

  it('lists every missing variable', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET/);
  });

  it('rejects short secrets', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(/at least 32/);
  });

  it('rejects identical secrets', () => {
    expect(() => validateEnv({ ...base, JWT_REFRESH_SECRET: base.JWT_ACCESS_SECRET })).toThrow(
      /must differ/,
    );
  });
});
