import type { CSSProperties } from 'react';

/**
 * Sets CSS variables only. Runtime numbers (widths, row offsets, progress) can't be
 * Tailwind classes, so they go in as variables and Tailwind classes read them:
 * `w-(--w)`, `scale-x-(--progress)`. This is the one approved use of `style`
 * (see docs/component-recipe.md, rule 13).
 */
export function cssVars(
  vars: Record<`--${string}`, string | number>,
): CSSProperties {
  return vars as CSSProperties;
}
