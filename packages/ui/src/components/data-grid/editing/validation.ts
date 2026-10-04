import type { DataGridColumnMeta } from '../data-grid-features';
import { isEmptyValue } from '../data-grid-utils';
import type { RowId } from './contract';

/** Messages per cell: `{ [rowId]: { [columnId]: message } }`. */
export type CellErrors = Readonly<
  Record<RowId, Readonly<Record<string, string>>>
>;

export const NO_ERRORS: CellErrors = {};

export type ValidatedColumn = {
  id: string;
  label: string;
  meta: DataGridColumnMeta | undefined;
};

/**
 * Runs the column rules (`required`, `validate`) on the given rows. Only editable
 * columns are checked: a read-only value isn't something the user can fix here.
 */
export function validateRows(
  rowIds: readonly RowId[],
  getRow: (rowId: RowId) => Readonly<Record<string, unknown>>,
  columns: readonly ValidatedColumn[],
): CellErrors {
  const errors: Record<RowId, Record<string, string>> = {};
  for (const rowId of rowIds) {
    const row = getRow(rowId);
    for (const { id, label, meta } of columns) {
      if (!meta?.editor) continue;
      const value = row[id];
      const message =
        meta.required && isEmptyValue(value)
          ? `${label} is required`
          : isEmptyValue(value)
            ? undefined
            : meta.validate?.(value, row);
      if (message) (errors[rowId] ??= {})[id] = message;
    }
  }
  return errors;
}

/** Client and server errors together. Where both exist for a cell, the client one wins: it's fresher. */
export function mergeErrors(
  client: CellErrors,
  server: CellErrors,
): CellErrors {
  if (server === NO_ERRORS || Object.keys(server).length === 0) return client;
  const out: Record<RowId, Record<string, string>> = {};
  for (const [rowId, cells] of Object.entries(server))
    out[rowId] = { ...cells };
  for (const [rowId, cells] of Object.entries(client))
    out[rowId] = { ...out[rowId], ...cells };
  return out;
}

/** Removes the given cells' errors (the user changed those cells). */
export function clearErrors(
  errors: CellErrors,
  cells: readonly { rowId: RowId; columnId: string }[],
): CellErrors {
  let out: Record<RowId, Record<string, string>> | null = null;
  for (const { rowId, columnId } of cells) {
    const row = (out ?? errors)[rowId];
    if (!row || !(columnId in row)) continue;
    out ??= { ...errors } as Record<RowId, Record<string, string>>;
    const rest = { ...row };
    delete rest[columnId];
    if (Object.keys(rest).length) out[rowId] = rest;
    else delete out[rowId];
  }
  return out ?? errors;
}

export function countErrors(errors: CellErrors): number {
  let n = 0;
  for (const cells of Object.values(errors)) n += Object.keys(cells).length;
  return n;
}
