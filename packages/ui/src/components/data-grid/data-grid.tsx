import {
  useTable,
  type OnChangeFn,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  defaultRangeExtractor,
  useVirtualizer,
  type Range,
} from '@tanstack/react-virtual';
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { Input } from '../input';
import {
  createDataGridColumnHelper,
  dataGridFeatures,
  type DataGridColumnDef,
  type DataGridFeatures,
} from './data-grid-features';

/** Row heights in px. Fixed heights are what keep 10k+ rows fast: no measuring. */
const ROW_HEIGHT = { compact: 32, standard: 40 } as const;
const SELECT_COLUMN_ID = '__select';
const EMPTY_SELECTION: RowSelectionState = {};

/**
 * Sets CSS variables only. Runtime numbers (widths, row offsets) can't be Tailwind
 * classes, so they go in as variables and Tailwind classes read them: `w-(--w)`.
 * This is the one approved use of `style` (see docs/component-recipe.md).
 */
function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}

export type DataGridProps<TData extends RowData> = {
  /** The rows. Keep the array reference stable between renders (state, memo or query). */
  data: TData[];
  /** Column definitions, built with `createDataGridColumnHelper<TData>()`. */
  columns: DataGridColumnDef<TData>[];
  /** A stable, unique id per row (usually the database id). Selection is keyed by it. */
  getRowId: (row: TData) => string;
  /** Accessible name of the grid, e.g. "Invoices". Screen readers announce it. */
  'aria-label': string;
  /** Adds a checkbox column with select-all. @default false */
  enableRowSelection?: boolean;
  /** Controlled selection: `{ [rowId]: true }`. Leave unset to let the grid own it. */
  rowSelection?: RowSelectionState;
  /** Called with the next selection when the user (de)selects rows. */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Shows the search box and row count above the grid. @default true */
  showToolbar?: boolean;
  /** Row height: `compact` (32px) for dense data, `standard` (40px). @default 'compact' */
  density?: keyof typeof ROW_HEIGHT;
  /** Shown when there are no rows, or no rows match the search. */
  emptyMessage?: ReactNode;
  /**
   * Classes for the outer wrapper. The grid fills it, so give it a height,
   * e.g. `h-[600px]` or `h-full` inside a sized parent. @default 'h-[32rem]'
   */
  className?: string;
};

/**
 * A virtualized, client-side data grid for large datasets (tested with 10,000 rows ×
 * 20 columns). Sorting, global search and row selection run in the browser.
 *
 * Built on TanStack Table v9 (data logic) and TanStack Virtual (only the rows in view
 * are in the DOM). Uses table semantics with explicit roles, plus `aria-rowcount` /
 * `aria-rowindex`, so screen readers know the full size even though most rows
 * aren't rendered.
 */
export function DataGrid<TData extends RowData>({
  data,
  columns: userColumns,
  getRowId,
  'aria-label': ariaLabel,
  enableRowSelection = false,
  rowSelection: controlledSelection,
  onRowSelectionChange,
  showToolbar = true,
  density = 'compact',
  emptyMessage = 'No rows to show.',
  className,
}: DataGridProps<TData>) {
  const rowHeight = ROW_HEIGHT[density];
  const searchId = useId();

  // Search text updates instantly in the input; the expensive filtering of 10k rows
  // uses the deferred copy, so typing never waits for the table.
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalSelection, setInternalSelection] =
    useState<RowSelectionState>(EMPTY_SELECTION);
  const rowSelection = controlledSelection ?? internalSelection;
  const handleSelectionChange: OnChangeFn<RowSelectionState> =
    onRowSelectionChange ?? setInternalSelection;

  const columns = useMemo(() => {
    if (!enableRowSelection) return userColumns;
    const col = createDataGridColumnHelper<TData>();
    const selectColumn = col.display({
      id: SELECT_COLUMN_ID,
      size: 44,
      enableSorting: false,
      enableGlobalFilter: false,
      header: ({ table }) => (
        <SelectCheckbox
          aria-label="Select all rows"
          checked={table.getIsAllRowsSelected()}
          // v9: "some" means at least one, so it's only mixed when not all are selected.
          indeterminate={
            table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
          }
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <SelectCheckbox
          aria-label={`Select row ${row.id}`}
          checked={row.getIsSelected()}
          // Click, not change: the click event carries Shift, which v9 uses for range select.
          onClick={row.getToggleSelectedHandler()}
          onChange={noop}
        />
      ),
    });
    return [selectColumn as DataGridColumnDef<TData>, ...userColumns];
  }, [enableRowSelection, userColumns]);

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data,
    getRowId,
    state: { sorting, globalFilter: deferredSearch, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) =>
      setSearch(
        (old) => (typeof updater === 'function' ? updater(old) : updater) ?? '',
      ),
    onRowSelectionChange: handleSelectionChange,
    enableRowSelection,
    // TanStack's default sorts number/date columns descending on the first click and
    // text ascending. Enterprise users expect the same first click everywhere (like
    // Excel), so every column starts ascending. A column can still opt out.
    sortDescFirst: false,
    globalFilterFn: 'includesString',
    getColumnCanGlobalFilter: (column) => column.id !== SELECT_COLUMN_ID,
  });

  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();
  const columnCount = table.getAllLeafColumns().length;
  const totalWidth = table.getTotalSize();

  // ---- Virtualization -------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusedIndex = useRef<number | null>(null);

  // Keep the row that has keyboard focus rendered even when it scrolls out of view,
  // otherwise React unmounts it and focus jumps to <body>.
  const rangeExtractor = useCallback((range: Range) => {
    const indexes = defaultRangeExtractor(range);
    const focused = focusedIndex.current;
    if (focused === null || focused >= range.count || indexes.includes(focused))
      return indexes;
    return [...indexes, focused].sort((a, b) => a - b);
  }, []);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan: 8,
    rangeExtractor,
    // Renders the first screen before the container is measured (SSR, tests).
    initialRect: { width: 1024, height: 640 },
  });

  // New sort or search → back to the top, so the user sees the first results.
  useEffect(() => {
    virtualizer.scrollToOffset(0);
  }, [sorting, deferredSearch, virtualizer]);

  const handleBodyFocus = (event: FocusEvent<HTMLTableSectionElement>) => {
    const index =
      event.target.closest<HTMLElement>('[data-index]')?.dataset['index'];
    focusedIndex.current = index === undefined ? null : Number(index);
  };
  const handleBodyBlur = (event: FocusEvent<HTMLTableSectionElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget))
      focusedIndex.current = null;
  };

  const selectedCount = Object.keys(rowSelection).length;
  const isSearching = deferredSearch.length > 0;

  return (
    <div
      className={cn(
        'flex h-[32rem] min-h-0 flex-col gap-3 font-sans text-fg',
        className,
      )}
    >
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            id={searchId}
            type="search"
            size="sm"
            aria-label={`Search ${ariaLabel}`}
            placeholder="Search all columns"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          {/* role=status: screen readers announce the new count after each search. */}
          <p role="status" className="text-sm text-fg-muted tabular-nums">
            {isSearching
              ? `${rows.length.toLocaleString()} of ${data.length.toLocaleString()} rows`
              : `${data.length.toLocaleString()} rows`}
            {selectedCount > 0 &&
              ` · ${selectedCount.toLocaleString()} selected`}
          </p>
        </div>
      )}

      {/* The scroll container. Focusable so keyboard users can scroll it with arrows. */}
      <div
        ref={scrollRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className="relative min-h-0 flex-1 overflow-auto rounded-md border border-border bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {/*
          Explicit roles: display:grid/flex on table elements makes some browsers drop
          the built-in table semantics, so we state them.
          aria-rowcount includes the header row; data rows start at aria-rowindex 2.
        */}
        <table
          role="table"
          aria-label={ariaLabel}
          aria-rowcount={rows.length + 1}
          aria-colcount={columnCount}
          className="grid w-max min-w-full w-(--table-w) border-collapse text-sm"
          style={cssVars({ '--table-w': `${totalWidth}px` })}
        >
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- display:grid can strip implicit table roles */}
          <thead role="rowgroup" className="sticky top-0 z-10 grid bg-surface">
            {headerGroups.map((group) => (
              <tr
                key={group.id}
                role="row"
                aria-rowindex={1}
                className="flex w-full"
              >
                {group.headers.map((header) => {
                  const column = header.column;
                  const sorted = column.getIsSorted();
                  const meta = column.columnDef.meta;
                  const isFirstSort = sorting[0]?.id === column.id;
                  return (
                    <th
                      key={header.id}
                      role="columnheader"
                      aria-colindex={header.index + 1}
                      // ARIA allows aria-sort on one header only, so mark the primary sort.
                      aria-sort={
                        isFirstSort
                          ? sorted === 'desc'
                            ? 'descending'
                            : 'ascending'
                          : undefined
                      }
                      className={cn(
                        'flex h-9 w-(--w) shrink-0 items-center border-b border-border-strong px-3',
                        'text-xs font-semibold whitespace-nowrap text-fg-muted',
                        meta?.align === 'end' && 'justify-end',
                        column.id === SELECT_COLUMN_ID && 'justify-center px-0',
                      )}
                      style={cssVars({ '--w': `${header.getSize()}px` })}
                    >
                      {header.isPlaceholder ? null : column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={column.getToggleSortingHandler()}
                          className={cn(
                            '-mx-1 inline-flex min-w-0 items-center gap-1 rounded px-1 py-0.5',
                            'hover:text-fg focus-visible:outline-2 focus-visible:outline-focus-ring',
                            sorted && 'text-fg',
                            meta?.align === 'end' && 'flex-row-reverse',
                          )}
                        >
                          <span className="truncate">
                            <table.FlexRender header={header} />
                          </span>
                          <SortIndicator direction={sorted} />
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- display:grid can strip implicit table roles */}
          <tbody
            role="rowgroup"
            className="relative grid h-(--body-h)"
            style={cssVars({
              '--body-h': `${Math.max(virtualizer.getTotalSize(), rowHeight)}px`,
            })}
            onFocus={handleBodyFocus}
            onBlur={handleBodyBlur}
          >
            {rows.length === 0 ? (
              <tr role="row" className="absolute flex w-full">
                <td
                  role="cell"
                  className="w-full px-3 py-6 text-center text-fg-muted"
                >
                  {isSearching
                    ? `No rows match "${deferredSearch}".`
                    : emptyMessage}
                </td>
              </tr>
            ) : (
              virtualizer.getVirtualItems().map((item) => {
                const row = rows[item.index];
                if (!row) return null;
                return (
                  <DataGridRow
                    key={row.id}
                    row={row}
                    index={item.index}
                    start={item.start}
                    rowHeight={rowHeight}
                    // Passed as a prop so memo re-renders the row when selection changes.
                    selected={row.getIsSelected()}
                    selectable={enableRowSelection}
                    FlexRender={table.FlexRender}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function noop() {
  /* React requires onChange on a controlled checkbox; the click handler does the work. */
}

type SelectCheckboxProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  indeterminate?: boolean;
};

/** Native checkbox. `indeterminate` is a DOM property, not an attribute, so it's set via ref. */
function SelectCheckbox({
  indeterminate = false,
  className,
  ...rest
}: SelectCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'size-4 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        className,
      )}
      {...rest}
    />
  );
}

function SortIndicator({ direction }: { direction: false | 'asc' | 'desc' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={cn('size-3 shrink-0', !direction && 'opacity-30')}
    >
      <path
        d="M6 2 9 5H3z"
        className={
          direction === 'asc'
            ? 'fill-current'
            : direction
              ? 'fill-current opacity-25'
              : 'fill-current'
        }
      />
      <path
        d="M6 10 3 7h6z"
        className={
          direction === 'desc'
            ? 'fill-current'
            : direction
              ? 'fill-current opacity-25'
              : 'fill-current'
        }
      />
    </svg>
  );
}

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
};

/**
 * One rendered row. Memoized: while scrolling, rows that stay on screen keep the same
 * props (same row object, same start offset), so React skips them and only renders the
 * rows that scroll into view. Without this, every visible row re-renders on every
 * scroll event.
 */
const DataGridRow = memo(function DataGridRow<TData extends RowData>({
  row,
  index,
  start,
  rowHeight,
  selected,
  selectable,
  FlexRender,
}: DataGridRowProps<TData>) {
  return (
    <tr
      role="row"
      data-index={index}
      aria-rowindex={index + 2}
      aria-selected={selectable ? selected : undefined}
      data-selected={selected || undefined}
      className={cn(
        'absolute top-0 left-0 flex h-(--row-h) w-full translate-y-(--y)',
        'border-b border-border',
        'hover:bg-surface data-selected:bg-primary/15',
      )}
      style={cssVars({ '--y': `${start}px`, '--row-h': `${rowHeight}px` })}
    >
      {row.getAllCells().map((cell, cellIndex) => {
        const meta = cell.column.columnDef.meta;
        return (
          <td
            key={cell.id}
            role="cell"
            aria-colindex={cellIndex + 1}
            className={cn(
              'flex w-(--w) shrink-0 items-center overflow-hidden px-3 whitespace-nowrap',
              meta?.align === 'end' && 'justify-end tabular-nums',
              meta?.mono && 'font-mono text-[0.8125rem]',
              cell.column.id === SELECT_COLUMN_ID && 'justify-center px-0',
            )}
            style={cssVars({ '--w': `${cell.column.getSize()}px` })}
          >
            <span className="truncate">
              <FlexRender cell={cell} />
            </span>
          </td>
        );
      })}
    </tr>
  );
}) as <TData extends RowData>(props: DataGridRowProps<TData>) => ReactNode;
