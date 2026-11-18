import { formatMrn, isValidMrn, isValidNpi, maskMrn } from './identifiers';

describe('identifiers', () => {
  it('round-trips generated MRNs', () => {
    const mrn = formatMrn('48213');
    expect(mrn).toMatch(/^MRN-[A-Z0-9]{6}-\d$/);
    expect(isValidMrn(mrn)).toBe(true);
  });

  it('detects a corrupted check digit', () => {
    const mrn = formatMrn('48213');
    const bad = mrn.slice(0, -1) + ((Number(mrn.slice(-1)) + 1) % 10);
    expect(isValidMrn(bad)).toBe(false);
  });

  it('validates NPIs', () => {
    expect(isValidNpi('1234567893')).toBe(true);
    expect(isValidNpi('1234567890')).toBe(false);
    expect(isValidNpi('abc')).toBe(false);
  });

  it('masks the leading characters of an MRN', () => {
    expect(maskMrn('MRN-482130-4')).toBe('MRN-***130-4');
  });
});
