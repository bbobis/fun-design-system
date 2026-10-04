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
import { Checkbox } from '../checkbox';
import {
  cellKey,
  cssVars,
  isEmptyValue,
  ROW_ERROR_KEY,
  SELECT_COLUMN_ID,
} from './data-grid-utils';
import { CheckIcon } from './icons';
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
  /** Checkbox cells: flip the value (click on the box). */
  onToggle: (rowId: string, columnId: string) => void;
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
  /** Messages for this row's invalid cells (`ROW_ERROR_KEY` for the whole row). */
  rowErrors: Readonly<Record<string, string>> | undefined;
  /** A row added in this session (not saved yet). */
  isNew: boolean;
  /** The "Type here to add a row…" row at the bottom. */
  isTrailing: boolean;
  /** Which column shows the "Type here to add a row…" hint. */
  hintColumnId: string | null;
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
  rowErrors,
  isNew,
  isTrailing,
  hintColumnId,
}: DataGridRowProps<TData>) {
  const rowState = rowErrors
    ? 'error'
    : rowDraft || isNew
      ? 'changed'
      : undefined;
  return (
    <tr
      role="row"
      data-index={index}
      aria-rowindex={index + 2}
      aria-selected={selectable ? selected : undefined}
      data-selected={selected || undefined}
      data-state={rowState}
      data-locked={locked || undefined}
      className={cn(
        'absolute top-0 left-0 flex h-(--row-h) w-full translate-y-(--y)',
        'border-b border-border',
        'hover:bg-surface',
        // Selected: a soft brand wash plus a 2px rail on the leading edge (inset shadow,
        // so nothing shifts by a pixel).
        'data-selected:bg-primary/10 data-selected:shadow-[inset_2px_0_0_var(--color-primary)]',
        'data-selected:hover:bg-primary/15',
        // Edit mode: a 3px rail marks rows with unsaved changes, red when the row has
        // errors (the states are exclusive, so the two rules never fight).
        'data-[state=changed]:shadow-[inset_3px_0_0_var(--color-primary)]',
        'data-[state=error]:shadow-[inset_3px_0_0_var(--color-danger)]',
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
        const label =
          typeof column.columnDef.header === 'string'
            ? column.columnDef.header
            : column.id;
        const value = cell.getValue();
        const isAccessor =
          'accessorKey' in column.columnDef || 'accessorFn' in column.columnDef;

        // What the cell shows (when it isn't being edited).
        let content: ReactNode;
        if (meta?.editor === 'checkbox') {
          content =
            editMode && !locked ? (
              <Checkbox
                checked={value === true}
                aria-label={label}
                // The cell is the tab stop; the box is clicked, not tabbed to.
                tabIndex={-1}
                onChange={() => cellApi.onToggle(row.id, column.id)}
              />
            ) : (
              <>
                {value === true && <CheckIcon className="size-4" />}
                <span className="sr-only">{value === true ? 'Yes' : 'No'}</span>
              </>
            );
        } else if (isAccessor && isEmptyValue(value)) {
          // Empty renders empty, whatever the column's own renderer would make of
          // null ("NaN", "0.00", today's date…).
          content =
            isTrailing && column.id === hintColumnId ? (
              <span className="truncate text-fg-muted">
                Type here to add a row…
              </span>
            ) : null;
        } else {
          content = (
            <span className="truncate">
              <FlexRender cell={cell} />
            </span>
          );
        }

        if (!editMode) {
          return (
            <td
              key={cell.id}
              role="cell"
              aria-colindex={cellIndex + 1}
              className={cn(base, !isSelectColumn && 'px-3')}
              style={style}
            >
              {content}
            </td>
          );
        }

        const focused = focusedColumnId === column.id;
        const isEditor = editingColumnId === column.id;
        const readOnly = locked || !meta?.editor;
        const dirty = rowDraft !== undefined && column.id in rowDraft;
        const inRange = cellIndex >= rangeStart && cellIndex <= rangeEnd;
        const error =
          rowErrors?.[column.id] ??
          (cellIndex === 0 ? rowErrors?.[ROW_ERROR_KEY] : undefined);
        const errorId = error
          ? `${cellKey(row.id, column.id)}-error`
          : undefined;
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
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            title={error}
            onMouseDown={(e) => cellApi.onCellMouseDown(cell, e)}
            onMouseEnter={(e) => cellApi.onCellMouseEnter(cell, e)}
            onDoubleClick={(e) => {
              // A double-click on a checkbox already toggled it twice; don't add a third.
              if ((e.target as HTMLElement).closest('input')) return;
              cellApi.onCellDoubleClick(row.id, column.id);
            }}
            className={cn(
              base,
              !isEditor && 'px-3',
              // The active cell's ring replaces the browser outline. outline-hidden keeps a
              // transparent outline, which Windows High Contrast mode still draws.
              'outline-hidden',
              // Invalid: a thin red ring (the focus ring, a data- rule, still wins).
              error && 'shadow-[inset_0_0_0_1px_var(--color-danger)]',
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
              content
            )}
            {error && (
              <>
                <span id={errorId} className="sr-only">
                  {error}
                </span>
                {/* Red corner flag, top-left. The message is in title and aria-describedby. */}
                <span
                  aria-hidden="true"
                  className="absolute start-0 top-0 border-e-[7px] border-t-[7px] border-e-transparent border-t-danger"
                />
              </>
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
