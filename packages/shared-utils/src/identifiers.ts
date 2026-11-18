/** Medical record numbers are formatted as MRN-XXXXXX-C with a Luhn-style check digit. */
export function checkDigit(body: string): number {
  let sum = 0;
  [...body].reverse().forEach((ch, i) => {
    let n = ch.charCodeAt(0) % 10;
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  });
  return (10 - (sum % 10)) % 10;
}

export function formatMrn(body: string): string {
  const clean = body.replace(/\W/g, '').toUpperCase().padStart(6, '0').slice(-6);
  return `MRN-${clean}-${checkDigit(clean)}`;
}

export function isValidMrn(value: string): boolean {
  const m = /^MRN-([A-Z0-9]{6})-(\d)$/.exec(value);
  return !!m && checkDigit(m[1]) === Number(m[2]);
}

/** National Provider Identifier validation (Luhn with the 80840 prefix). */
export function isValidNpi(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) return false;
  const digits = ('80840' + npi).split('').map(Number).reverse();
  const sum = digits.reduce((acc, d, i) => {
    if (i % 2 === 1) {
      const dbl = d * 2;
      return acc + (dbl > 9 ? dbl - 9 : dbl);
    }
    return acc + d;
  }, 0);
  return sum % 10 === 0;
}

export function maskMrn(mrn: string): string {
  return mrn.replace(/^(MRN-)[A-Z0-9]{3}/, '$1***');
}
