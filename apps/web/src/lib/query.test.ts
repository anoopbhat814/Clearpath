import { parseQueryString, toQueryString } from './query';

describe('query string helpers', () => {
  it('drops empty values', () => {
    expect(toQueryString({ q: 'smith', status: undefined, page: 2, empty: '' })).toBe('?q=smith&page=2');
  });

  it('returns an empty string when nothing is set', () => {
    expect(toQueryString({ a: null })).toBe('');
  });

  it('round-trips', () => {
    expect(parseQueryString(toQueryString({ a: 1, b: 'x y' }))).toEqual({ a: '1', b: 'x y' });
  });
});
