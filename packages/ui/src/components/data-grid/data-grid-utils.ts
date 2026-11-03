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

/** Escapes quotes and backslashes for a `[attr="…"]` selector (jsdom has no CSS.escape). */
export const escapeAttr = (value: string) => value.replace(/["\\]/g, '\\$&');

/** Finds a rendered cell by key (null if its row is virtualized away). */
export function findCell(root: HTMLElement | null, key: string) {
  return (
    root?.querySelector<HTMLElement>(`[data-cell-key="${escapeAttr(key)}"]`) ??
    null
  );
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

/** How one pinned column sticks. */
export type PinnedCell = {
  /** Which edge it sticks to. */
  side: 'start' | 'end';
  /** Its distance from that edge in px (the widths of the pinned columns outside it). */
  offset: number;
  /** The very first start-pinned column: it redraws the row's rail (see below). */
  first: boolean;
  /** Borders the scrolling columns: it draws the edge line. */
  edge: boolean;
};

/**
 * Pinned columns: column id → how it sticks. Cells read the offset as `--pin`.
 * `null` when nothing is pinned.
 */
export type PinnedColumns = Readonly<Record<string, PinnedCell>> | null;

/**
 * Classes for a pinned cell. It sticks to an edge while the rest scrolls under it,
 * so it needs a **solid** background: the row's own fills are see-through
 * (`bg-primary/10`, `bg-surface/60`), which would show the scrolled cells through it.
 * Each row state therefore gets an opaque mix with the page color here.
 */
export function pinnedCellClass(pin: PinnedCell, striped: boolean) {
  return [
    // Static class names per side: Tailwind can't see `${side}-(--pin)`.
    pin.side === 'start'
      ? 'sticky start-(--pin) z-[1]'
      : 'sticky end-(--pin) z-[1]',
    'bg-bg',
    striped &&
      'bg-[color-mix(in_oklab,var(--color-surface)_60%,var(--color-bg))]',
    'group-hover/row:bg-surface',
    'group-data-selected/row:bg-[color-mix(in_oklab,var(--color-primary)_10%,var(--color-bg))]',
    'group-data-selected/row:group-hover/row:bg-[color-mix(in_oklab,var(--color-primary)_15%,var(--color-bg))]',
    // The row's selected / changed / error rails are drawn on the row, under this
    // opaque cell, so the first pinned cell draws them again.
    pin.first && [
      'group-data-selected/row:shadow-[inset_2px_0_0_var(--color-primary)]',
      'group-data-[state=changed]/row:shadow-[inset_3px_0_0_var(--color-primary)]',
      'group-data-[state=error]/row:shadow-[inset_3px_0_0_var(--color-danger)]',
      'group-data-[state=deleted]/row:shadow-[inset_3px_0_0_var(--color-danger)]',
    ],
    pin.edge && pinEdgeClass(pin.side),
  ];
}

/**
 * The line between pinned and scrolling cells: on the inner side of the group. A
 * pseudo-element inside the cell (cells clip their overflow, so it can't sit outside).
 */
export function pinEdgeClass(side: 'start' | 'end') {
  return side === 'start'
    ? "after:pointer-events-none after:absolute after:inset-y-0 after:end-0 after:w-px after:bg-border-strong after:content-['']"
    : "after:pointer-events-none after:absolute after:inset-y-0 after:start-0 after:w-px after:bg-border-strong after:content-['']";
}

/**
 * How wide an element's content is when nothing clips it, padding included. A Range
 * around the contents measures the laid-out text even inside `truncate` (the clipped
 * part still has a box). `null` where layout isn't available (jsdom, no Range rects).
 */
export function contentWidth(el: HTMLElement): number | null {
  const range = document.createRange();
  range.selectNodeContents(el);
  if (typeof range.getBoundingClientRect !== 'function') return null;
  const style = getComputedStyle(el);
  return (
    range.getBoundingClientRect().width +
    (parseFloat(style.paddingLeft) || 0) +
    (parseFloat(style.paddingRight) || 0)
  );
}
