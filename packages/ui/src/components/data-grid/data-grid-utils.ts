/**
 * Small helpers shared by the DataGrid and its rows. No React state here.
 */
import type { CSSProperties } from 'react';

/** Row id of the trailing "Type here to add a row…" row. */
export const NEW_ROW_ID = '__new';

/** Key for row-level errors (not tied to one field) inside a row's error map. */
export const ROW_ERROR_KEY = '__row';

/** Id of the injected row-selection checkbox column. */
export const SELECT_COLUMN_ID = '__select';

/**
 * Sets CSS variables only. Runtime numbers (widths, row offsets) can't be Tailwind
 * classes, so they go in as variables and Tailwind classes read them: `w-(--w)`.
 * This is the one approved use of `style` (see docs/component-recipe.md).
 */
export function cssVars(
  vars: Record<`--${string}`, string | number>,
): CSSProperties {
  return vars as CSSProperties;
}

/** Identifies one cell in the DOM: `data-cell-key="rowId:columnId"`. */
export const cellKey = (rowId: string, columnId: string) =>
  `${rowId}:${columnId}`;

/** Finds a rendered cell by key (null if its row is virtualized away). */
export function findCell(root: HTMLElement | null, key: string) {
  // Escape quotes and backslashes for the attribute selector (jsdom has no CSS.escape).
  const safe = key.replace(/["\\]/g, '\\$&');
  return root?.querySelector<HTMLElement>(`[data-cell-key="${safe}"]`) ?? null;
}

export function escapeHtml(text: string) {
  return text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** The row isn't in the selected range. One shared object, so memo sees "no change". */
export const NO_RANGE = {
  rangeStart: -1,
  rangeEnd: -1,
  rangeTop: false,
  rangeBottom: false,
} as const;

export function noop() {
  /* React requires onChange on a controlled checkbox; the click handler does the work. */
}

export function clamp(value: number, length: number) {
  return Math.max(0, Math.min(length - 1, value));
}

export function plural(n: number, word: string) {
  return `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;
}

/** Reads `row[columnId]`. Editable columns are accessor columns, so id = field name. */
export function fieldValue(row: unknown, columnId: string): unknown {
  return row == null ? undefined : (row as Record<string, unknown>)[columnId];
}

export function toEditorText(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  // Excel's own spelling, so a copied checkbox column pastes back into Excel as booleans.
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}

/** Nothing to show or save: null, undefined or an empty string. */
export function isEmptyValue(value: unknown): boolean {
  return value == null || value === '';
}
