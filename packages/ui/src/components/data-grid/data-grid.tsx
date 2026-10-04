import {
  useTable,
  type CellSelectionState,
  type Column,
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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SVGProps,
} from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Input } from '../input';
import {
  createDataGridColumnHelper,
  dataGridFeatures,
  type DataGridColumnDef,
  type DataGridFeatures,
} from './data-grid-features';
import {
  CellEditor,
  parseEditorValue,
  type CellEditorElement,
} from './editing/cell-editor';
import type { DataGridEditing } from './editing/contract';
import {
  applyDraft,
  countChanges,
  EMPTY_DRAFT,
  setDraftValue,
  toChangeSet,
  type Draft,
} from './editing/draft';
import { getGridKeyAction } from './editing/keyboard';
import { SaveBar } from './editing/save-bar';

/** Row heights in px. Fixed heights are what keep 10k+ rows fast: no measuring. */
const ROW_HEIGHT = { compact: 32, standard: 40 } as const;
const SELECT_COLUMN_ID = '__select';
const EMPTY_SELECTION: RowSelectionState = {};
const NO_SORTING: SortingState = [];

/**
 * Sets CSS variables only. Runtime numbers (widths, row offsets) can't be Tailwind
 * classes, so they go in as variables and Tailwind classes read them: `w-(--w)`.
 * This is the one approved use of `style` (see docs/component-recipe.md).
 */
function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}

/** Identifies one cell in the DOM: `data-cell-key="rowId:columnId"`. */
const cellKey = (rowId: string, columnId: string) => `${rowId}:${columnId}`;

/** What `renderBulkActions` receives. */
export type DataGridBulkActionsContext = {
  /** Ids (from `getRowId`) of every selected row, including rows hidden by search. */
  selectedRowIds: string[];
  /** Clears the selection, e.g. after an action finishes. */
  clearSelection: () => void;
};

export type DataGridProps<TData extends RowData> = {
  /** The rows. Keep the array reference stable between renders (state, memo or query). */
  data: TData[];
  /** Column definitions, built with `createDataGridColumnHelper<TData>()`. */
  columns: DataGridColumnDef<TData>[];
  /** A stable, unique id per row (usually the database id). Selection and edits are keyed by it. */
  getRowId: (row: TData) => string;
  /** Accessible name of the grid, e.g. "Invoices". Screen readers announce it. */
  'aria-label': string;
  /** Adds a checkbox column with select-all. Hidden while editing. @default false */
  enableRowSelection?: boolean;
  /** Controlled selection: `{ [rowId]: true }`. Leave unset to let the grid own it. */
  rowSelection?: RowSelectionState;
  /** Called with the next selection when the user (de)selects rows. */
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Visible title in the grid's header bar, e.g. "Invoices". */
  title?: ReactNode;
  /** Extra controls on the right of the header bar (buttons, menus). A slot: any nodes. */
  toolbarActions?: ReactNode;
  /**
   * Actions shown in the bar that appears while rows are selected ("Export",
   * "Mark as paid"). A function, because what it shows depends on the selection.
   * The bar always shows the count and "Clear selection"; this adds your buttons.
   */
  renderBulkActions?: (context: DataGridBulkActionsContext) => ReactNode;
  /**
   * Turns on edit mode: an "Edit table" button, keyboard editing like a spreadsheet,
   * and a "Save all" bar. Columns become editable with `meta.editor`. After a
   * successful save, pass the updated rows in `data`.
   */
  editing?: DataGridEditing<TData>;
  /** Shows the header bar (title, count, search, actions). @default true */
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

type EditingCell = { rowId: string; columnId: string; initial: string };

/**
 * A virtualized, client-side data grid for large datasets (tested with 10,000 rows ×
 * 20 columns). Sorting, global search, row selection and (optionally) editing run in
 * the browser.
 *
 * Built on TanStack Table v9 (data logic) and TanStack Virtual (only the rows in view
 * are in the DOM). Read mode uses table semantics; edit mode switches to the ARIA grid
 * pattern (one tab stop, arrow keys between cells). `aria-rowcount` / `aria-rowindex`
 * tell screen readers the full size even though most rows aren't rendered.
 */
export function DataGrid<TData extends RowData>({
  data,
  columns: userColumns,
  getRowId,
  'aria-label': ariaLabel,
  enableRowSelection = false,
  rowSelection: controlledSelection,
  onRowSelectionChange,
  title,
  toolbarActions,
  renderBulkActions,
  editing,
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

  // ---- Edit mode state -------------------------------------------------------
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const isEditing = mode === 'edit' && editing !== undefined;
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [cellSelection, setCellSelection] = useState<CellSelectionState>([]);
  // Row order is frozen while editing: the ids shown when "Edit table" was clicked.
  // Otherwise editing a sorted (or searched) column makes the row jump away.
  const [frozenIds, setFrozenIds] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>();
  const [announcement, setAnnouncement] = useState('');
  const editorRef = useRef<CellEditorElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  // The cell that should receive DOM focus once it is rendered (see the layout effect).
  const pendingFocus = useRef<string | null>(null);

  const rowsById = useMemo(
    () => new Map(data.map((row) => [getRowId(row), row])),
    [data, getRowId],
  );
  const tableData = useMemo(() => {
    if (!isEditing || !frozenIds) return data;
    const frozen: TData[] = [];
    for (const id of frozenIds) {
      const row = rowsById.get(id);
      if (row) frozen.push(row);
    }
    // The draft is applied to the data, not to the cells: edited rows become
    // { ...row, ...changes }, so every cell renderer shows draft values for free.
    return applyDraft(frozen, draft, getRowId);
  }, [isEditing, frozenIds, data, rowsById, draft, getRowId]);

  const columns = useMemo(() => {
    if (!enableRowSelection || isEditing) return userColumns;
    const col = createDataGridColumnHelper<TData>();
    const selectColumn = col.display({
      id: SELECT_COLUMN_ID,
      size: 44,
      enableSorting: false,
      enableGlobalFilter: false,
      header: ({ table }) => (
        <Checkbox
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
        <Checkbox
          aria-label={`Select row ${row.id}`}
          checked={row.getIsSelected()}
          // Click, not change: the click event carries Shift, which v9 uses for range select.
          onClick={row.getToggleSelectedHandler()}
          onChange={noop}
        />
      ),
    });
    return [selectColumn as DataGridColumnDef<TData>, ...userColumns];
  }, [enableRowSelection, isEditing, userColumns]);

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: tableData,
    getRowId,
    state: {
      // In edit mode the frozen ids already carry the sort and search order.
      sorting: isEditing ? NO_SORTING : sorting,
      globalFilter: isEditing ? '' : deferredSearch,
      rowSelection,
      cellSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) =>
      setSearch(
        (old) => (typeof updater === 'function' ? updater(old) : updater) ?? '',
      ),
    onRowSelectionChange: handleSelectionChange,
    onCellSelectionChange: setCellSelection,
    // Every draft change creates new `data`; don't let that reset the active cell.
    autoResetCellSelection: false,
    enableRowSelection,
    // TanStack's default sorts number/date columns descending on the first click and
    // text ascending. Enterprise users expect the same first click everywhere (like
    // Excel), so every column starts ascending. A column can still opt out.
    sortDescFirst: false,
    globalFilterFn: 'includesString',
    getColumnCanGlobalFilter: (column) => column.id !== SELECT_COLUMN_ID,
  });

  const rows = table.getRowModel().rows;
  const leafColumns = table.getAllLeafColumns();
  const headerGroups = table.getHeaderGroups();
  const columnCount = leafColumns.length;
  const totalWidth = table.getTotalSize();
  const rowIndexById = useMemo(
    () => new Map(rows.map((row, i) => [row.id, i])),
    [rows],
  );

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
    // The sticky header covers the first 36px; scrolling to a row must clear it.
    scrollPaddingStart: 36,
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
    if (!isEditing && !event.currentTarget.contains(event.relatedTarget))
      focusedIndex.current = null;
  };

  // Moving focus to a cell that may not exist yet. With virtualization, the target
  // row can be off screen and unmounted; calling .focus() on nothing does nothing.
  // So we remember the cell, scroll its row into range, and focus it after whichever
  // render first contains it. This effect runs after every render; it is a cheap
  // no-op when nothing is pending.
  useLayoutEffect(() => {
    const key = pendingFocus.current;
    if (!key) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(
      `[data-cell-key="${key.replace(/["\\]/g, '\\$&')}"]`,
    );
    if (!el) return;
    pendingFocus.current = null;
    if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
    // Horizontal (and fine vertical) reveal. scroll-pt-9 on the container keeps the
    // cell clear of the sticky header. jsdom has no scrollIntoView, hence the `?.`.
    el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  });

  // ---- Edit mode actions -----------------------------------------------------
  const announce = useCallback((message: string) => {
    // A zero-width space toggle makes screen readers repeat an identical message.
    setAnnouncement((prev) =>
      prev === message ? `${message}\u200B` : message,
    );
  }, []);

  const changeCount = countChanges(draft);
  const changedRowCount = Object.keys(draft).length;
  const isDirty = changeCount > 0;

  const focusCell = (rowIndex: number, columnIndex: number) => {
    const row = rows[rowIndex];
    const column = leafColumns[columnIndex];
    if (!row || !column) return;
    table.setFocusedCell(row.id, column.id);
    focusedIndex.current = rowIndex;
    pendingFocus.current = cellKey(row.id, column.id);
    virtualizer.scrollToIndex(rowIndex, { align: 'auto' });
  };

  const refocusActiveCell = () => {
    const cell = table.getFocusedCell();
    if (cell) pendingFocus.current = cellKey(cell.row.id, cell.column.id);
  };

  const enterEdit = () => {
    const first = rows[0];
    const firstColumn = userColumns.length
      ? table.getAllLeafColumns().find((c) => c.id !== SELECT_COLUMN_ID)
      : undefined;
    setFrozenIds(rows.map((r) => r.id));
    setSaveMessage(undefined);
    setMode('edit');
    if (first && firstColumn) {
      table.setFocusedCell(first.id, firstColumn.id);
      focusedIndex.current = 0;
      pendingFocus.current = cellKey(first.id, firstColumn.id);
      virtualizer.scrollToIndex(0);
    }
    announce(
      'Editing: arrows move, type to replace, Enter edits. Sorting and search are paused.',
    );
  };

  const exitEdit = () => {
    setMode('read');
    setFrozenIds(null);
    setEditingCell(null);
    setCellSelection([]);
    focusedIndex.current = null;
    setAnnouncement('');
    requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  const startEdit = (rowId: string, columnId: string, seed?: string) => {
    if (saving) return;
    const column = table.getColumn(columnId);
    const row = rowsById.get(rowId);
    const meta = column?.columnDef.meta;
    if (!column || !row || !meta?.editor) {
      announce(`${headerLabel(column)} is read-only.`);
      return;
    }
    // Lock on the *saved* row: changing Status to "Paid" in the draft shouldn't lock
    // the row halfway through an edit.
    if (editing?.isRowLocked?.(row)) {
      announce('This row is locked.');
      return;
    }
    const shown = draft[rowId]?.[columnId] ?? fieldValue(row, columnId);
    const current = toEditorText(shown);
    let initial = seed ?? current;
    if (meta.editor === 'select' && seed !== undefined) {
      // Type-to-replace in a list: jump to the first option starting with that letter.
      initial =
        meta.options?.find((o) =>
          o.toLowerCase().startsWith(seed.toLowerCase()),
        ) ?? current;
    }
    setEditingCell({ rowId, columnId, initial });
  };

  /** Writes the editor's value into the draft. Returns false if the value is invalid. */
  const commitEdit = (
    dRow: number,
    dCol: number,
    { refocus = true }: { refocus?: boolean } = {},
  ) => {
    if (!editingCell) return true;
    const { rowId, columnId } = editingCell;
    const column = table.getColumn(columnId);
    const kind = column?.columnDef.meta?.editor ?? 'text';
    const raw = editorRef.current?.value ?? editingCell.initial;
    const parsed = parseEditorValue(kind, raw);
    if (!parsed.ok) {
      announce(`${headerLabel(column)}: ${parsed.message}.`);
      if (refocus) editorRef.current?.focus();
      return false;
    }
    const original = fieldValue(rowsById.get(rowId), columnId);
    setDraft((d) => setDraftValue(d, rowId, columnId, parsed.value, original));
    setEditingCell(null);
    if (!refocus) return true;
    const rowIndex = rowIndexById.get(rowId) ?? 0;
    const columnIndex = leafColumns.findIndex((c) => c.id === columnId);
    focusCell(
      clamp(rowIndex + dRow, rows.length),
      clamp(columnIndex + dCol, leafColumns.length),
    );
    return true;
  };

  const cancelEdit = () => {
    setEditingCell(null);
    refocusActiveCell();
  };

  const handleGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (!isEditing || saving) return;
    const focused = table.getFocusedCell();
    if (!focused) return;
    const action = getGridKeyAction(
      {
        key: event.key,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        isComposing: event.nativeEvent.isComposing,
      },
      {
        editing: editingCell !== null,
        row: rowIndexById.get(focused.row.id) ?? 0,
        col: leafColumns.findIndex((c) => c.id === focused.column.id),
        rowCount: rows.length,
        colCount: leafColumns.length,
      },
    );
    switch (action.type) {
      case 'move':
        event.preventDefault();
        focusCell(action.row, action.col);
        return;
      case 'edit':
        event.preventDefault();
        startEdit(focused.row.id, focused.column.id, action.seed);
        return;
      case 'commit':
        event.preventDefault();
        commitEdit(action.dRow, action.dCol);
        return;
      case 'cancel':
        event.preventDefault();
        cancelEdit();
        return;
    }
  };

  const save = async () => {
    if (!editing || saving) return;
    const changes = toChangeSet(draft, rowsById, editing.getRowVersion);
    setSaving(true);
    setSaveMessage(undefined);
    try {
      const result = await editing.onSave(changes);
      if (!result || result.ok) {
        setDraft(EMPTY_DRAFT);
        refocusActiveCell(); // the bar (and its button) disappears; keep the keyboard in the grid
        announce(`Saved ${plural(changeCount, 'change')}.`);
      } else {
        const message =
          result.kind === 'conflict'
            ? 'Some rows changed on the server. Nothing was saved.'
            : 'Some changes were rejected. Nothing was saved.';
        setSaveMessage(message);
        announce(message);
      }
    } catch {
      const message = "Couldn't save. Your changes are kept.";
      setSaveMessage(message);
      announce(message);
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(EMPTY_DRAFT);
    setEditingCell(null);
    setSaveMessage(undefined);
    refocusActiveCell();
    announce('Changes discarded.');
  };

  // Warn before closing the tab, but only while there is unsaved work. The listener
  // is removed when clean, because it also blocks the browser's back/forward cache.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // Memoized rows need stable callbacks. These wrappers never change identity and
  // always call the latest handlers (stored in a ref after each render).
  const latest = useRef({ startEdit, commitEdit, isEditing });
  useLayoutEffect(() => {
    latest.current = { startEdit, commitEdit, isEditing };
  });
  const cellApi = useMemo<CellApi>(
    () => ({
      editorRef,
      onCellMouseDown: (rowId, columnId, event) => {
        if ((event.target as HTMLElement).closest('[data-editor]')) return;
        table.setFocusedCell(rowId, columnId);
        pendingFocus.current = cellKey(rowId, columnId);
      },
      onCellDoubleClick: (rowId, columnId) =>
        latest.current.startEdit(rowId, columnId),
      onEditorBlur: (event) => {
        // Clicking another cell or a button commits, like Excel. Moving focus inside
        // the grid via our own keys has already committed.
        if (event.currentTarget.isConnected)
          latest.current.commitEdit(0, 0, { refocus: false });
      },
    }),
    [table],
  );

  const isRowLocked = (rowId: string) => {
    if (!isEditing || !editing?.isRowLocked) return false;
    const saved = rowsById.get(rowId);
    return saved ? editing.isRowLocked(saved) : false;
  };

  const selectedRowIds = Object.keys(rowSelection);
  const selectedCount = selectedRowIds.length;
  const isSearching = deferredSearch.length > 0;
  const focusedCell = isEditing ? table.getFocusedCell() : undefined;

  const clearSelection = useCallback(() => {
    table.resetRowSelection(true);
    // The bar (and the button that was clicked) disappears; put focus somewhere
    // sensible instead of letting it fall to <body>.
    scrollRef.current?.focus();
  }, [table]);

  return (
    <div
      className={cn(
        'flex h-[32rem] min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-bg font-sans text-fg',
        className,
      )}
    >
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {title && (
              <span className="truncate text-[0.9375rem] font-semibold">
                {title}
              </span>
            )}
            <span className="rounded-full bg-surface px-2 py-px text-xs font-medium text-fg-muted tabular-nums">
              {data.length.toLocaleString()}
            </span>
            {isEditing && (
              <span className="rounded-full bg-primary px-2 py-px text-xs font-medium text-on-primary">
                Editing
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <SearchIcon className="pointer-events-none absolute start-2.5 size-3.5 text-fg-muted" />
              <Input
                id={searchId}
                type="search"
                size="sm"
                aria-label={`Search ${ariaLabel}`}
                placeholder={
                  isEditing ? 'Search paused while editing' : 'Search'
                }
                value={search}
                disabled={isEditing}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 max-w-full border-border bg-surface ps-8"
              />
            </div>
            {editing && (
              <Button
                ref={editButtonRef}
                size="sm"
                intent="secondary"
                disabled={isEditing && (isDirty || saving)}
                title={
                  isEditing && isDirty
                    ? 'Save or discard your changes first'
                    : undefined
                }
                onClick={isEditing ? exitEdit : enterEdit}
              >
                {isEditing ? (
                  'Done'
                ) : (
                  <>
                    <PencilIcon className="size-3.5" />
                    Edit table
                  </>
                )}
              </Button>
            )}
            {toolbarActions}
          </div>
        </div>
      )}

      {/*
        The scroll container. In read mode it is focusable so keyboard users can scroll
        it with arrows. In edit mode the active cell is the tab stop instead.
      */}
      <div
        ref={scrollRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={isEditing ? -1 : 0}
        className="relative min-h-0 flex-1 scroll-pt-9 overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
      >
        {/*
          Explicit roles: display:grid/flex on table elements makes some browsers drop
          the built-in table semantics, so we state them. Edit mode switches to the ARIA
          grid pattern: one tab stop, arrows between cells.
          aria-rowcount includes the header row; data rows start at aria-rowindex 2.
        */}
        <table
          role={isEditing ? 'grid' : 'table'}
          aria-label={ariaLabel}
          aria-rowcount={rows.length + 1}
          aria-colcount={columnCount}
          className="grid w-max min-w-full w-(--table-w) border-collapse text-sm"
          style={cssVars({ '--table-w': `${totalWidth}px` })}
          onKeyDown={handleGridKeyDown}
        >
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- display:grid can strip implicit table roles */}
          <thead role="rowgroup" className="sticky top-0 z-10 grid bg-bg">
            {headerGroups.map((group) => (
              <tr
                key={group.id}
                role="row"
                aria-rowindex={1}
                className="flex w-full"
              >
                {group.headers.map((header) => {
                  const column = header.column;
                  const sorted = isEditing ? false : column.getIsSorted();
                  const meta = column.columnDef.meta;
                  const isFirstSort =
                    !isEditing && sorting[0]?.id === column.id;
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
                        // `group` lets children react to hovering the whole header cell.
                        'group flex h-9 w-(--w) shrink-0 items-center gap-1 border-y border-border px-3',
                        'text-xs font-medium whitespace-nowrap text-fg-muted',
                        meta?.align === 'end' && 'justify-end',
                        column.id === SELECT_COLUMN_ID && 'justify-center px-0',
                      )}
                      style={cssVars({ '--w': `${header.getSize()}px` })}
                    >
                      {header.isPlaceholder ? null : !isEditing &&
                        column.getCanSort() ? (
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
                        <>
                          <span className="truncate">
                            <table.FlexRender header={header} />
                          </span>
                          {isEditing && meta?.editor && (
                            <PencilIcon
                              className={cn(
                                'size-3 shrink-0 opacity-60',
                                meta.align === 'end' && '-order-1',
                              )}
                            />
                          )}
                        </>
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
                  role={isEditing ? 'gridcell' : 'cell'}
                  className="w-full px-3 py-10 text-center text-fg-muted"
                >
                  {isSearching && !isEditing
                    ? `No rows match "${deferredSearch}".`
                    : emptyMessage}
                </td>
              </tr>
            ) : (
              virtualizer.getVirtualItems().map((item) => {
                const row = rows[item.index];
                if (!row) return null;
                const hasFocus = focusedCell?.row.id === row.id;
                const isEditingRow = editingCell?.rowId === row.id;
                return (
                  <DataGridRow
                    key={row.id}
                    row={row}
                    index={item.index}
                    start={item.start}
                    rowHeight={rowHeight}
                    // Passed as a prop so memo re-renders the row when selection changes.
                    selected={!isEditing && row.getIsSelected()}
                    selectable={enableRowSelection && !isEditing}
                    FlexRender={table.FlexRender}
                    editMode={isEditing}
                    locked={isRowLocked(row.id)}
                    rowDraft={isEditing ? draft[row.id] : undefined}
                    focusedColumnId={
                      hasFocus ? (focusedCell?.column.id ?? null) : null
                    }
                    editingColumnId={isEditingRow ? editingCell.columnId : null}
                    editingInitial={isEditingRow ? editingCell.initial : ''}
                    cellApi={cellApi}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (isDirty || saveMessage) ? (
        <SaveBar
          changeCount={changeCount}
          rowCount={changedRowCount}
          saving={saving}
          message={saveMessage}
          onSave={() => void save()}
          onDiscard={discard}
        />
      ) : (
        enableRowSelection &&
        !isEditing &&
        selectedCount > 0 && (
          // data-inverse flips the theme for this bar only (dark on light pages, light on
          // dark), so it stands out without new colours. See tokens.css.
          <div
            data-inverse
            className="flex flex-wrap items-center gap-2 bg-bg px-4 py-2 text-sm text-fg"
          >
            <span className="me-2 font-medium tabular-nums">
              {selectedCount.toLocaleString()} selected
            </span>
            {renderBulkActions?.({ selectedRowIds, clearSelection })}
            <span className="flex-1" />
            <Button intent="ghost" size="sm" onClick={clearSelection}>
              Clear selection
            </Button>
          </div>
        )
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-xs text-fg-muted">
        {/* role=status: screen readers announce the new count after each search. */}
        <p role="status" className="tabular-nums">
          {isSearching && !isEditing
            ? `${rows.length.toLocaleString()} of ${data.length.toLocaleString()} rows`
            : `${rows.length.toLocaleString()} rows`}
          {selectedCount > 0 &&
            !isEditing &&
            ` · ${selectedCount.toLocaleString()} selected`}
        </p>
        {/*
          Edit-mode messages ("Saved 3 changes", "This row is locked"). Visible, so
          sighted users get the same feedback; aria-live so screen readers hear it.
          Always rendered: a live region must exist before its text changes.
        */}
        <p aria-live="polite" className="truncate text-end">
          {isEditing ? announcement : ''}
        </p>
      </div>
    </div>
  );
}

function noop() {
  /* React requires onChange on a controlled checkbox; the click handler does the work. */
}

function clamp(value: number, length: number) {
  return Math.max(0, Math.min(length - 1, value));
}

function plural(n: number, word: string) {
  return `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;
}

/** Reads `row[columnId]`. Editable columns are accessor columns, so id = field name. */
function fieldValue(row: unknown, columnId: string): unknown {
  return row == null ? undefined : (row as Record<string, unknown>)[columnId];
}

function toEditorText(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function headerLabel<TData extends RowData>(
  column: Column<DataGridFeatures, TData> | undefined,
): string {
  const header = column?.columnDef.header;
  return typeof header === 'string' ? header : (column?.id ?? 'This column');
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      {...props}
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}

function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10.5 2.5l3 3-8 8H2.5v-3z" />
    </svg>
  );
}

function SortIndicator({ direction }: { direction: false | 'asc' | 'desc' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={cn(
        'size-3 shrink-0 transition-opacity',
        // Unsorted columns stay quiet: the icon appears on hover/focus of the header only.
        !direction &&
          'opacity-0 group-hover:opacity-50 group-focus-within:opacity-50',
      )}
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

/** Stable callbacks the memoized rows use in edit mode. */
type CellApi = {
  editorRef: RefObject<CellEditorElement | null>;
  onCellMouseDown: (rowId: string, columnId: string, event: MouseEvent) => void;
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
};

/**
 * One rendered row. Memoized: while scrolling, rows that stay on screen keep the same
 * props (same row object, same start offset), so React skips them and only renders the
 * rows that scroll into view. In edit mode only the rows whose focus, editor or draft
 * changed re-render, because those props are per row.
 */
const DataGridRow = memo(function DataGridRow<TData extends RowData>({
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
            onMouseDown={(e) => cellApi.onCellMouseDown(row.id, column.id, e)}
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
