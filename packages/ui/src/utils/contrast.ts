/**
 * WCAG contrast helpers.
 *
 * Contrast ratio = (lighter luminance + 0.05) / (darker luminance + 0.05), from 1 to 21.
 * WCAG 2.1 AA asks for at least 4.5:1 for normal text and 3:1 for large text and UI parts
 * such as borders, icons and focus rings.
 * Spec: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

/** An sRGB color as three 0–255 channels. */
export type Rgb = readonly [r: number, g: number, b: number];

/**
 * Parses `#rgb`, `#rrggbb`, `rgb(r, g, b)` or `rgb(r g b)` (what `getComputedStyle` returns).
 * Returns `null` for anything else, so callers can decide how to handle unknown input.
 */
export function parseColor(input: string): Rgb | null {
  const value = input.trim();

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
    const n = Number.parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  return null;
}

/** Relative luminance (0 = black, 1 = white), per the WCAG formula. */
export function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two colors, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** The best WCAG 2.1 level a ratio reaches for normal-size text. */
export type WcagLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}
