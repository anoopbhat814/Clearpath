import { skipTake, toPage } from './paginate';

describe('paginate helpers', () => {
  it('computes skip and take', () => {
    expect(skipTake(3, 25)).toEqual({ skip: 50, take: 25 });
    expect(skipTake(0, 10)).toEqual({ skip: 0, take: 10 });
  });

  it('computes total pages with a floor of one', () => {
    expect(toPage([], 0, 1, 25).totalPages).toBe(1);
    expect(toPage([1], 51, 1, 25).totalPages).toBe(3);
  });
});
