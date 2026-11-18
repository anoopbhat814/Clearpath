import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('quotes cells containing separators and escapes quotes', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('neutralizes formula injection', () => {
    expect(csvCell('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)");
    expect(csvCell('@cmd')).toBe("'@cmd");
  });

  it('serializes dates, objects and nulls', () => {
    expect(csvCell(new Date('2026-01-02T03:04:05Z'))).toBe('2026-01-02T03:04:05.000Z');
    expect(csvCell({ a: 1 })).toBe('"{""a"":1}"');
    expect(csvCell(null)).toBe('');
  });

  it('writes a header and rows', () => {
    expect(toCsv([{ id: '1', note: 'x' }], ['id', 'note'])).toBe('id,note\n1,x\n');
  });
});
