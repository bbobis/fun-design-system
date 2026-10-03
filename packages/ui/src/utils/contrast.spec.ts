import {
  contrastRatio,
  parseColor,
  relativeLuminance,
  wcagLevel,
} from './contrast';

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseColor('#ffb81c')).toEqual([255, 184, 28]);
  });

  it('parses 3-digit hex by doubling each digit', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255]);
  });

  it('parses the rgb() form that getComputedStyle returns', () => {
    expect(parseColor('rgb(18, 18, 18)')).toEqual([18, 18, 18]);
    expect(parseColor('rgb(18 18 18)')).toEqual([18, 18, 18]);
  });

  it('returns null for anything it does not understand', () => {
    expect(parseColor('')).toBeNull();
    expect(parseColor('var(--fds-primary)')).toBeNull();
    expect(parseColor('oklch(0.5 0.1 100)')).toBeNull();
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white, in either order', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 1);
  });

  it('matches the brand decisions: yellow-500 fails with white text and passes with gray-900', () => {
    const yellow500 = [255, 184, 28] as const;
    expect(contrastRatio(yellow500, [255, 255, 255])).toBeCloseTo(1.7, 1);
    expect(contrastRatio(yellow500, [18, 18, 18])).toBeCloseTo(10.8, 1);
  });
});

describe('wcagLevel', () => {
  it('maps ratios to WCAG 2.1 levels for normal text', () => {
    expect(wcagLevel(21)).toBe('AAA');
    expect(wcagLevel(7)).toBe('AAA');
    expect(wcagLevel(4.5)).toBe('AA');
    expect(wcagLevel(3)).toBe('AA-large');
    expect(wcagLevel(2.9)).toBe('fail');
  });
});
