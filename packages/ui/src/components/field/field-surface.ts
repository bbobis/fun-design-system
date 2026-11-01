/**
 * The look of a field's box, shared by Input, Select and Combobox (and any future
 * field), so they match in one form. Change a field style here, once.
 *
 * Only the *surface* (border + fill). Each control adds its own size, padding and
 * state selectors, because the element that has the focus/invalid state differs
 * (the input itself, or a wrapper around it).
 */
export const fieldSurface = {
  outline: 'border border-border-strong bg-bg',
  // A grey fill alone is too close to the page (≈1.1:1), and a field's edge must reach
  // 3:1 (WCAG 1.4.11). So it keeps a strong *bottom* line, like Material's filled
  // field, with square bottom corners so that line runs straight.
  filled:
    'rounded-b-none border border-transparent border-b-border-strong bg-surface hover:bg-border/40',
} as const;

export type FieldVariant = keyof typeof fieldSurface;
