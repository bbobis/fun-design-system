import { must } from './must';

describe('must', () => {
  it('returns a present value, including falsy ones', () => {
    expect(must(0)).toBe(0);
    expect(must('')).toBe('');
    expect(must(false)).toBe(false);
  });

  it('throws a clear message for null and undefined', () => {
    expect(() => must(null, 'the hint id')).toThrow(
      'Expected the hint id to be present, got null',
    );
    expect(() => must(undefined)).toThrow(
      'Expected value to be present, got undefined',
    );
  });
});
