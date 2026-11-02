/**
 * Small helpers shared by the DataGrid and its rows. No React state here.
 */

/** Row id of the trailing "Type here to add a row…" row. */
export const NEW_ROW_ID = '__new';

/** Key for row-level errors (not tied to one field) inside a row's error map. */
export const ROW_ERROR_KEY = '__row';

/** Id of the injected row-selection checkbox column. */
export const SELECT_COLUMN_ID = '__select';

// Moved to utils/ (used library-wide now); re-exported so grid imports stay as they are.
export { cssVars } from '../../utils/css-vars';

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

/**
 * Pinned columns (`pinFirstColumn`): column id → its left offset in px. Cells read
 * the offset as `--pin`. `null` when nothing is pinned.
 */
export type PinnedColumns = Readonly<Record<string, number>> | null;

/**
 * Classes for a pinned cell. It sticks to the start edge while the rest scrolls under
 * it, so it needs a **solid** background: the row's own fills are see-through
 * (`bg-primary/10`, `bg-surface/60`), which would show the scrolled cells through it.
 * Each row state therefore gets an opaque mix with the page color here.
 */
export function pinnedCellClass(opts: {
  last: boolean;
  first: boolean;
  striped: boolean;
}) {
  return [
    'sticky start-(--pin) z-[1] bg-bg',
    opts.striped &&
      'bg-[color-mix(in_oklab,var(--color-surface)_60%,var(--color-bg))]',
    'group-hover/row:bg-surface',
    'group-data-selected/row:bg-[color-mix(in_oklab,var(--color-primary)_10%,var(--color-bg))]',
    'group-data-selected/row:group-hover/row:bg-[color-mix(in_oklab,var(--color-primary)_15%,var(--color-bg))]',
    // The row's selected / changed / error rails are drawn on the row, under this
    // opaque cell, so the first pinned cell draws them again.
    opts.first && [
      'group-data-selected/row:shadow-[inset_2px_0_0_var(--color-primary)]',
      'group-data-[state=changed]/row:shadow-[inset_3px_0_0_var(--color-primary)]',
      'group-data-[state=error]/row:shadow-[inset_3px_0_0_var(--color-danger)]',
    ],
    // The edge between pinned and scrolling cells. A pseudo-element inside the cell
    // (cells clip their overflow, so it can't sit outside).
    opts.last &&
      "after:pointer-events-none after:absolute after:inset-y-0 after:end-0 after:w-px after:bg-border-strong after:content-['']",
  ];
}
