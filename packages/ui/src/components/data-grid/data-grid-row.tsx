import type { Row, RowData, useTable } from '@tanstack/react-table';
import {
  memo,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../../utils/cn';
import type { DataGridFeatures } from './data-grid-features';
import { cellKey, cssVars, SELECT_COLUMN_ID } from './data-grid-utils';
import { CellEditor, type CellEditorElement } from './editing/cell-editor';

/**
 * The few parts of a TanStack cell the mouse handlers use. A small structural type
 * instead of `Cell<Features, TData>`: a generic Cell<TData> won't assign to Cell<any>
 * in every position, and these handlers don't care about the row type at all.
 */
export type GridCell = {
  row: { id: string };
  column: { id: string };
  getSelectionStartHandler: () => (event: unknown) => void;
  getSelectionExtendHandler: () => (event: unknown) => void;
};

/** Stable callbacks the memoized rows use in edit mode. */
export type CellApi = {
  editorRef: RefObject<CellEditorElement | null>;
  onCellMouseDown: (cell: GridCell, event: MouseEvent) => void;
  onCellMouseEnter: (cell: GridCell, event: MouseEvent) => void;
  onCellDoubleClick: (rowId: string, columnId: string) => void;
  onEditorBlur: (event: FocusEvent<CellEditorElement>) => void;
};

type DataGridRowProps<TData extends RowData> = {
  row: Row<DataGridFeatures, TData>;
  index: number;
  start: number;
  rowHeight: number;
  selected: boolean;
  selectable: boolean;
  FlexRender: ReturnType<
    typeof useTable<DataGridFeatures, TData>
  >['FlexRender'];
  editMode: boolean;
  locked: boolean;
  /** This row's unsaved changes (same object until this row changes, so memo works). */
  rowDraft: Readonly<Record<string, unknown>> | undefined;
  focusedColumnId: string | null;
  editingColumnId: string | null;
  editingInitial: string;
  cellApi: CellApi;
  /** The selected range's columns in this row (-1 when the row is outside it). */
  rangeStart: number;
  rangeEnd: number;
  /** First / last row of the range: draws the outline's top / bottom edge. */
  rangeTop: boolean;
  rangeBottom: boolean;
};

/**
 * One rendered row. Memoized: while scrolling, rows that stay on screen keep the same
 * props (same row object, same start offset), so React skips them and only renders the
 * rows that scroll into view. In edit mode only the rows whose focus, editor or draft
 * changed re-render, because those props are per row.
 */
export const DataGridRow = memo(function DataGridRow<TData extends RowData>({
  row,
  index,
  start,
  rowHeight,
  selected,
  selectable,
  FlexRender,
  editMode,
  locked,
  rowDraft,
  focusedColumnId,
  editingColumnId,
  editingInitial,
  cellApi,
  rangeStart,
  rangeEnd,
  rangeTop,
  rangeBottom,
}: DataGridRowProps<TData>) {
  return (
    <tr
      role="row"
      data-index={index}
      aria-rowindex={index + 2}
      aria-selected={selectable ? selected : undefined}
      data-selected={selected || undefined}
      data-changed={rowDraft ? true : undefined}
      data-locked={locked || undefined}
      className={cn(
        'absolute top-0 left-0 flex h-(--row-h) w-full translate-y-(--y)',
        'border-b border-border',
        'hover:bg-surface',
        // Selected: a soft brand wash plus a 2px rail on the leading edge (inset shadow,
        // so nothing shifts by a pixel).
        'data-selected:bg-primary/10 data-selected:shadow-[inset_2px_0_0_var(--color-primary)]',
        'data-selected:hover:bg-primary/15',
        // Edit mode: a 3px rail marks rows with unsaved changes; locked rows are muted.
        'data-changed:shadow-[inset_3px_0_0_var(--color-primary)]',
        'data-locked:text-fg-muted',
      )}
      style={cssVars({ '--y': `${start}px`, '--row-h': `${rowHeight}px` })}
    >
      {row.getAllCells().map((cell, cellIndex) => {
        const column = cell.column;
        const meta = column.columnDef.meta;
        const isSelectColumn = column.id === SELECT_COLUMN_ID;
        const base = cn(
          'relative flex w-(--w) shrink-0 items-center overflow-hidden whitespace-nowrap',
          meta?.align === 'end' && 'justify-end tabular-nums',
          meta?.mono && 'font-mono text-[0.8125rem]',
          isSelectColumn && 'justify-center',
        );
        const style = cssVars({ '--w': `${column.getSize()}px` });

        if (!editMode) {
          return (
            <td
              key={cell.id}
              role="cell"
              aria-colindex={cellIndex + 1}
              className={cn(base, !isSelectColumn && 'px-3')}
              style={style}
            >
              <span className="truncate">
                <FlexRender cell={cell} />
              </span>
            </td>
          );
        }

        const focused = focusedColumnId === column.id;
        const isEditor = editingColumnId === column.id;
        const readOnly = locked || !meta?.editor;
        const dirty = rowDraft !== undefined && column.id in rowDraft;
        const inRange = cellIndex >= rangeStart && cellIndex <= rangeEnd;
        return (
          <td
            key={cell.id}
            role="gridcell"
            aria-colindex={cellIndex + 1}
            aria-readonly={readOnly || undefined}
            data-cell-key={cellKey(row.id, column.id)}
            data-focused={focused || undefined}
            // Roving tabindex: only the active cell is in the tab order.
            tabIndex={focused ? 0 : -1}
            aria-selected={inRange || undefined}
            onMouseDown={(e) => cellApi.onCellMouseDown(cell, e)}
            onMouseEnter={(e) => cellApi.onCellMouseEnter(cell, e)}
            onDoubleClick={() => cellApi.onCellDoubleClick(row.id, column.id)}
            className={cn(
              base,
              !isEditor && 'px-3',
              // The active cell's ring replaces the browser outline. outline-hidden keeps a
              // transparent outline, which Windows High Contrast mode still draws.
              'outline-hidden',
              !readOnly &&
                'hover:shadow-[inset_0_0_0_1px_var(--color-border-strong)]',
              'data-focused:shadow-[inset_0_0_0_2px_var(--color-fg)]',
              // Range: a light tint, plus an outline drawn by a ::before layer (borders on
              // the cell itself would shift the layout; one box-shadow is already the ring).
              inRange && [
                'bg-primary/10',
                'before:pointer-events-none before:absolute before:inset-0 before:border-primary',
                rangeTop && 'before:border-t-2',
                rangeBottom && 'before:border-b-2',
                cellIndex === rangeStart && 'before:border-s-2',
                cellIndex === rangeEnd && 'before:border-e-2',
              ],
              readOnly && !locked && 'text-fg-muted',
            )}
            style={style}
          >
            {isEditor && meta?.editor ? (
              <span data-editor className="contents">
                <CellEditor
                  kind={meta.editor}
                  label={
                    typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id
                  }
                  initialValue={editingInitial}
                  options={meta.options}
                  align={meta.align}
                  editorRef={cellApi.editorRef}
                  onBlur={cellApi.onEditorBlur}
                />
              </span>
            ) : (
              <span className="truncate">
                <FlexRender cell={cell} />
              </span>
            )}
            {dirty && (
              // Unsaved-change dot, top-right corner. aria-hidden: the Save bar and the
              // row rail carry this information; a dot per cell would be noise.
              <span
                aria-hidden="true"
                className="absolute end-1 top-1 size-1.5 rounded-full bg-primary"
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}) as <TData extends RowData>(props: DataGridRowProps<TData>) => ReactNode;
