import { fullName, initials, percent, titleCase } from './format';

describe('format helpers', () => {
  it('formats names last-name first', () => {
    expect(fullName({ firstName: 'Mina', lastName: 'Okafor' })).toBe('Okafor, Mina');
  });

  it('title-cases enum values', () => {
    expect(titleCase('IN_PROGRESS')).toBe('In Progress');
    expect(titleCase('URGENT')).toBe('Urgent');
  });

  it('formats percentages', () => {
    expect(percent(0.857)).toBe('86%');
    expect(percent(0.857, 1)).toBe('85.7%');
  });

  it('builds initials', () => {
    expect(initials('mina', 'okafor')).toBe('MO');
  });
});
