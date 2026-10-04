import {
  cellSelectionFeature,
  columnFilteringFeature,
  columnSizingFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table';

/** The in-cell editors. Date and searchable-select editors come later (they need popovers). */
export type DataGridEditorKind = 'text' | 'number' | 'select';

/** Extra column settings the DataGrid understands. Set them in a column's `meta`. */
export type DataGridColumnMeta = {
  /** Right-align numbers and amounts so digits line up. @default 'start' */
  align?: 'start' | 'end';
  /** Render the cell in IBM Plex Mono (IDs, codes, SKUs). @default false */
  mono?: boolean;
  /**
   * Makes the column editable in edit mode, with this editor. Only works on columns
   * made with `col.accessor('field')`: the grid writes the value back to that field.
   * Columns without an editor are read-only.
   */
  editor?: DataGridEditorKind;
  /** Choices for the `select` editor. */
  options?: readonly string[];
};

/**
 * The TanStack Table v9 features the DataGrid uses. v9 only includes what's listed here,
 * so adding a capability (resizing, pinning…) starts with adding its feature.
 */
export const dataGridFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSelectionFeature,
  columnSizingFeature,
  // Active cell + roving tabindex in edit mode (and cell ranges, later).
  cellSelectionFeature,
  // Type-only slot: makes `meta` on every column typed as DataGridColumnMeta.
  columnMeta: {} as DataGridColumnMeta,
});

export type DataGridFeatures = typeof dataGridFeatures;

/** A column definition for `DataGrid<TData>`. */
export type DataGridColumnDef<TData extends RowData> = ColumnDef<
  DataGridFeatures,
  TData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TValue differs per column; the helper keeps each precise.
  any
>;

/**
 * Typed column builder for a DataGrid.
 *
 * @example
 * const col = createDataGridColumnHelper<Invoice>();
 * const columns = col.columns([
 *   col.accessor('number', { header: 'Invoice', meta: { mono: true } }),
 *   col.accessor('total', { header: 'Total', meta: { align: 'end' } }),
 * ]);
 */
export function createDataGridColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataGridFeatures, TData>();
}
