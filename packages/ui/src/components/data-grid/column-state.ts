/**
 * The user's column layout: order, hidden columns and pinned columns. Our own shape
 * (not TanStack's three state objects), so apps can store it, send it to a server or
 * reset it without depending on the table library. Pure functions only: no React.
 */

/** Which edge a pinned column sticks to. `start` is the left in left-to-right languages. */
export type DataGridPinSide = 'start' | 'end';

export type DataGridColumnState = {
  /** Every column id, in display order (pinned columns keep their place here too). */
  order: readonly string[];
  /** Ids of hidden columns. */
  hidden: readonly string[];
  /** Ids pinned to each edge, in the order they stick (outermost first for `start`). */
  pinned: {
    readonly start: readonly string[];
    readonly end: readonly string[];
  };
  /**
   * Widths in px the user set by resizing. Columns not listed use their `size`.
   * Optional, so layouts saved before resizing existed still load.
   */
  widths?: Readonly<Record<string, number>>;
};

/** The narrowest a user can make a column: room for a few characters and the ⌄ button. */
export const MIN_COLUMN_WIDTH = 48;
/** The widest: past this, a column is better shown in a detail view. */
export const MAX_COLUMN_WIDTH = 800;

/** Sets a column's width, rounded and kept between the min and max. */
export function setColumnWidth(
  state: DataGridColumnState,
  id: string,
  px: number,
): DataGridColumnState {
  const width = Math.round(
    Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, px)),
  );
  if (state.widths?.[id] === width) return state;
  return { ...state, widths: { ...state.widths, [id]: width } };
}

/** The layout as the columns were written: nothing hidden, nothing pinned. */
export function defaultColumnState(
  columnIds: readonly string[],
  pinFirst = false,
): DataGridColumnState {
  return {
    order: columnIds,
    hidden: [],
    pinned: { start: pinFirst && columnIds[0] ? [columnIds[0]] : [], end: [] },
  };
}

/**
 * Brings a saved state up to date with the current columns: drops ids that no longer
 * exist and appends new columns at the end. A saved layout never hides a new column.
 */
export function reconcileColumnState(
  state: DataGridColumnState,
  columnIds: readonly string[],
): DataGridColumnState {
  const known = new Set(columnIds);
  const order = state.order.filter((id) => known.has(id));
  for (const id of columnIds) if (!order.includes(id)) order.push(id);
  const keep = (ids: readonly string[]) => ids.filter((id) => known.has(id));
  const same =
    order.length === state.order.length &&
    order.every((id, i) => id === state.order[i]) &&
    keep(state.hidden).length === state.hidden.length &&
    keep(state.pinned.start).length === state.pinned.start.length &&
    keep(state.pinned.end).length === state.pinned.end.length &&
    keep(Object.keys(state.widths ?? {})).length ===
      Object.keys(state.widths ?? {}).length;
  if (same) return state;
  return {
    order,
    hidden: keep(state.hidden),
    pinned: { start: keep(state.pinned.start), end: keep(state.pinned.end) },
    ...(state.widths && {
      widths: Object.fromEntries(
        Object.entries(state.widths).filter(([id]) => known.has(id)),
      ),
    }),
  };
}

/** Where a column sits: its pin group, or `center` for the scrolling ones. */
export function pinSideOf(
  state: DataGridColumnState,
  id: string,
): DataGridPinSide | 'center' {
  if (state.pinned.start.includes(id)) return 'start';
  if (state.pinned.end.includes(id)) return 'end';
  return 'center';
}

/**
 * The visible columns in the order they are drawn: start-pinned, then the scrolling
 * ones, then end-pinned. This is also the order arrow keys and "Move" follow.
 */
export function displayOrder(state: DataGridColumnState): string[] {
  const hidden = new Set(state.hidden);
  const visible = (ids: readonly string[]) =>
    ids.filter((id) => !hidden.has(id));
  const pinned = new Set([...state.pinned.start, ...state.pinned.end]);
  return [
    ...visible(state.pinned.start),
    ...visible(state.order.filter((id) => !pinned.has(id))),
    ...visible(state.pinned.end),
  ];
}

/** Ids a column can swap with: the visible columns in its own pin group. */
function groupOf(state: DataGridColumnState, id: string): string[] {
  const side = pinSideOf(state, id);
  const shown = displayOrder(state);
  return shown.filter((other) => pinSideOf(state, other) === side);
}

/**
 * Can `id` move one step (`-1` = toward the start, `+1` = toward the end)? Moves stay
 * inside the column's group: a scrolling column can't jump into the pinned ones.
 */
export function canMove(
  state: DataGridColumnState,
  id: string,
  step: -1 | 1,
): boolean {
  const group = groupOf(state, id);
  const i = group.indexOf(id);
  return i >= 0 && i + step >= 0 && i + step < group.length;
}

/** Swaps `id` with its visible neighbour in the same group. Hidden columns are skipped. */
export function moveColumn(
  state: DataGridColumnState,
  id: string,
  step: -1 | 1,
): DataGridColumnState {
  if (!canMove(state, id, step)) return state;
  const group = groupOf(state, id);
  const neighbour = group[group.indexOf(id) + step];
  const swap = (ids: readonly string[]) =>
    ids.map((x) => (x === id ? neighbour : x === neighbour ? id : x));
  const side = pinSideOf(state, id);
  if (side === 'center') return { ...state, order: swap(state.order) };
  return {
    ...state,
    pinned: { ...state.pinned, [side]: swap(state.pinned[side]) },
  };
}

/**
 * Pins `id` to an edge (`null` unpins). A newly pinned start column goes on the inside
 * of the group (next to the scrolling columns), like spreadsheet "freeze".
 */
export function pinColumn(
  state: DataGridColumnState,
  id: string,
  side: DataGridPinSide | null,
): DataGridColumnState {
  const start = state.pinned.start.filter((x) => x !== id);
  const end = state.pinned.end.filter((x) => x !== id);
  if (side === 'start') start.push(id);
  if (side === 'end') end.unshift(id);
  return { ...state, pinned: { start, end } };
}

export function setColumnHidden(
  state: DataGridColumnState,
  id: string,
  hidden: boolean,
): DataGridColumnState {
  const rest = state.hidden.filter((x) => x !== id);
  return { ...state, hidden: hidden ? [...rest, id] : rest };
}

/** Shows exactly `visibleIds` (the "Columns" checklist). */
export function setVisibleColumns(
  state: DataGridColumnState,
  visibleIds: readonly string[],
): DataGridColumnState {
  const visible = new Set(visibleIds);
  return { ...state, hidden: state.order.filter((id) => !visible.has(id)) };
}

/**
 * The same layout in TanStack's terms. `extraStart` are grid-owned columns (the
 * selection checkbox) that always come first and stick with the start-pinned ones.
 */
export function toTableState(
  state: DataGridColumnState,
  extraStart: readonly string[] = [],
) {
  const hasStart = state.pinned.start.length > 0;
  return {
    columnOrder: [...extraStart, ...state.order],
    columnVisibility: Object.fromEntries(state.hidden.map((id) => [id, false])),
    columnPinning: {
      start: hasStart ? [...extraStart, ...state.pinned.start] : [],
      end: [...state.pinned.end],
    },
    columnSizing: { ...state.widths },
  };
}
