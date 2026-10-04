import type { RowData } from '@tanstack/react-table';
import type { ChangeSet, RowId } from './contract';

/**
 * Unsaved edits, kept apart from the server data: `{ [rowId]: { [columnId]: value } }`.
 * Immutable on purpose: an edit replaces only that row's object, so React (and our
 * memoized rows) can tell exactly which rows changed with a `===` check.
 */
export type Draft = Readonly<Record<RowId, Readonly<Record<string, unknown>>>>;

export const EMPTY_DRAFT: Draft = {};

/** Equal for our purposes: same primitive, or two Dates with the same time. */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  return Object.is(a, b);
}

/**
 * Returns a new draft with one cell set. Typing the original value back removes the
 * entry, so "changed and changed back" counts as clean, like Excel's undo-to-saved.
 */
export function setDraftValue(
  draft: Draft,
  rowId: RowId,
  columnId: string,
  value: unknown,
  original: unknown,
): Draft {
  const row = { ...draft[rowId] };
  if (sameValue(value, original)) delete row[columnId];
  else row[columnId] = value;

  const next = { ...draft };
  if (Object.keys(row).length === 0) delete next[rowId];
  else next[rowId] = row;
  return next;
}

/** Number of changed cells. */
export function countChanges(draft: Draft): number {
  let n = 0;
  for (const row of Object.values(draft)) n += Object.keys(row).length;
  return n;
}

/**
 * The rows the table should show: edited rows become `{ ...row, ...changes }`, every
 * other row keeps its identity. That's what lets the normal cell renderers (badges,
 * money formats) display draft values with no changes.
 */
export function applyDraft<TData extends RowData>(
  rows: readonly TData[],
  draft: Draft,
  getRowId: (row: TData) => string,
): TData[] {
  if (draft === EMPTY_DRAFT || Object.keys(draft).length === 0)
    return rows as TData[];
  return rows.map((row) => {
    const changes = draft[getRowId(row)];
    return changes ? ({ ...row, ...changes } as TData) : row;
  });
}

/**
 * Builds the backend-neutral payload for `onSave`. Rows in `newRows` (temp id →
 * default values) become `create` operations with their defaults plus what the user
 * typed; every other changed row is an `update` with only its changed fields.
 */
export function toChangeSet<TData extends RowData>(
  draft: Draft,
  rowsById: ReadonlyMap<string, TData>,
  getRowVersion?: (id: string, row: TData) => number | string | undefined,
  newRows: ReadonlyMap<string, Readonly<Record<string, unknown>>> = new Map(),
): ChangeSet {
  const operations: ChangeSet['operations'] = [];
  for (const [id, changes] of Object.entries(draft)) {
    const defaults = newRows.get(id);
    if (defaults) {
      operations.push({
        op: 'create',
        tempId: id,
        values: { ...defaults, ...changes },
      });
      continue;
    }
    const row = rowsById.get(id);
    const version = row && getRowVersion ? getRowVersion(id, row) : undefined;
    operations.push({
      op: 'update',
      id,
      ...(version === undefined ? {} : { version }),
      changes: { ...changes },
    });
  }
  return { operations };
}
