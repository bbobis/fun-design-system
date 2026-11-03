import type { RowData } from '@tanstack/react-table';
import type { ChangeSet, RowId } from './contract';

/**
 * Unsaved edits, kept apart from the server data: `{ [rowId]: { [columnId]: value } }`.
 * Immutable on purpose: an edit replaces only that row's object, so React (and our
 * memoized rows) can tell exactly which rows changed with a `===` check.
 */
export type Draft = Readonly<Record<RowId, Readonly<Record<string, unknown>>>>;

export const EMPTY_DRAFT: Draft = {};

/**
 * A deleted row is marked in the draft like an edited cell: `{ __deleted: true }`.
 * So delete and restore go through the same history as any edit (Undo works), and a
 * failed save keeps them, with no second kind of state to keep in sync.
 */
export const DELETED_ROW_KEY = '__deleted';

/** Is this row marked for deletion in the draft? */
export const isDeletedRow = (
  rowDraft: Readonly<Record<string, unknown>> | undefined,
) => rowDraft?.[DELETED_ROW_KEY] === true;

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

/** Number of changes: one per changed cell, and one per deleted row (its edits don't count). */
export function countChanges(draft: Draft): number {
  let n = 0;
  for (const row of Object.values(draft))
    n += isDeletedRow(row) ? 1 : Object.keys(row).length;
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
 * default values) become `create` operations; rows marked deleted become `delete`
 * operations (or nothing, for a new row that was never saved). The rest: with their defaults plus what the user
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
    if (isDeletedRow(changes)) {
      // A new row deleted before it was ever saved: nothing to tell the server.
      if (defaults) continue;
      const row = rowsById.get(id);
      const version = row && getRowVersion ? getRowVersion(id, row) : undefined;
      operations.push({
        op: 'delete',
        id,
        ...(version === undefined ? {} : { version }),
      });
      continue;
    }
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
