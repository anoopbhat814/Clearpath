import * as bcrypt from 'bcryptjs';

const MIN_LENGTH = 12;

export function assertPasswordStrength(password: string): void {
  const problems: string[] = [];
  if (password.length < MIN_LENGTH) problems.push(`at least ${MIN_LENGTH} characters`);
  if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
  if (!/\d/.test(password)) problems.push('a digit');
  if (problems.length) throw new Error(`Password must contain ${problems.join(', ')}`);
}

export const hashPassword = (password: string, rounds = 12) => bcrypt.hash(password, rounds);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
