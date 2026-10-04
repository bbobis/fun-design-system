import {
  useTable,
  type CellSelectionState,
  type Column,
  type OnChangeFn,
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
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
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
  parseEditorValue,
  type CellEditorElement,
} from './editing/cell-editor';
import type {
  DataGridEditing,
  SaveConflict,
  SaveResult,
} from './editing/contract';
import {
  applyDraft,
  countChanges,
  EMPTY_DRAFT,
  sameValue,
  setDraftValue,
  toChangeSet,
  type Draft,
} from './editing/draft';
import {
  EMPTY_HISTORY,
  record,
  takeRedo,
  takeUndo,
  type CellChange,
  type History,
} from './editing/history';
import { getGridKeyAction } from './editing/keyboard';
import { boundsOf, cellCount, planPaste, type Bounds } from './editing/range';
import { DataGridRow, type CellApi } from './data-grid-row';
import {
  cellKey,
  clamp,
  cssVars,
  escapeHtml,
  fieldValue,
  findCell,
  NEW_ROW_ID,
  NO_RANGE,
  noop,
  plural,
  ROW_ERROR_KEY,
  SELECT_COLUMN_ID,
  toEditorText,
} from './data-grid-utils';
import { PencilIcon, SearchIcon, SortIndicator } from './icons';
import { SaveBar } from './editing/save-bar';
import { parseTsv, toTsv } from './editing/tsv';
import {
  clearErrors,
  mergeErrors,
  NO_ERRORS,
  validateRows,
  type CellErrors,
} from './editing/validation';

type NewRows = ReadonlyMap<string, Readonly<Record<string, unknown>>>;
const NO_NEW_ROWS: NewRows = new Map();

/** After a conflict: the server's newer values and versions, valid for one `data` only. */
type Overrides<TData> = {
  data: readonly TData[] | null;
  rows: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  versions: Readonly<Record<string, number | string>>;
};

/** Row heights in px. Fixed heights are what keep 10k+ rows fast: no measuring. */
const ROW_HEIGHT = { compact: 32, standard: 40 } as const;
const EMPTY_SELECTION: RowSelectionState = {};
const NO_SORTING: SortingState = [];

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
  const [frozen, setFrozen] = useState<{
    order: string[];
    known: ReadonlySet<string>;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>();
  const [announcement, setAnnouncement] = useState('');
  const [history, setHistory] = useState<History>(EMPTY_HISTORY);
  // New rows: temp id → starting values (from editing.newRow). What the user types
  // into them lives in the draft, like any other edit.
  const [newRows, setNewRows] = useState<NewRows>(NO_NEW_ROWS);
  const newRowsRef = useRef(
    new Map<string, Readonly<Record<string, unknown>>>(),
  );
  const tempSeq = useRef(0);
  const [serverErrors, setServerErrors] = useState<CellErrors>(NO_ERRORS);
  const [conflicts, setConflicts] = useState<readonly SaveConflict[]>([]);
  const [overrides, setOverrides] = useState<Overrides<TData>>({
    data: null,
    rows: {},
    versions: {},
  });
  // Rows without a real id yet (new rows, the trailing "add" row) get their temp id here.
  const [tempIdOf] = useState(() => new WeakMap<object, string>());
  const allowAdd = isEditing && editing?.allowAdd === true;
  const trailingRow = useMemo(() => {
    const row = {} as TData;
    tempIdOf.set(row as object, NEW_ROW_ID);
    return row;
  }, [tempIdOf]);
  const editorRef = useRef<CellEditorElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  // The cell that should receive DOM focus once it is rendered (see the layout effect).
  const pendingFocus = useRef<string | null>(null);
  // A cell to scroll into view without focusing it (the moving corner of a Shift+range).
  const pendingReveal = useRef<string | null>(null);

  // Overrides only count for the `data` they were made against; new data from the app
  // (a refetch) is newer, so they are dropped automatically.
  const activeOverrides = overrides.data === data ? overrides : null;
  /** The saved rows by id (with any "Use theirs" values from a conflict). */
  const rowsById = useMemo(() => {
    const map = new Map(data.map((row) => [getRowId(row), row]));
    if (activeOverrides)
      for (const [id, current] of Object.entries(activeOverrides.rows)) {
        const row = map.get(id);
        if (row) map.set(id, { ...row, ...current } as TData);
      }
    return map;
  }, [data, getRowId, activeOverrides]);
  const getTableRowId = useCallback(
    (row: TData) => tempIdOf.get(row as object) ?? getRowId(row),
    [tempIdOf, getRowId],
  );

  const tableData = useMemo(() => {
    if (!isEditing || !frozen) return data;
    const base: TData[] = [];
    for (const id of frozen.order) {
      const row = rowsById.get(id);
      if (row) base.push(row);
    }
    // Rows that appeared since "Edit table" (e.g. new rows you just saved) go last.
    for (const [id, row] of rowsById) if (!frozen.known.has(id)) base.push(row);
    // The draft is applied to the data, not to the cells: edited rows become
    // { ...row, ...changes }, so every cell renderer shows draft values for free.
    const shown = applyDraft(base, draft, getRowId);
    const out = shown === base ? [...base] : shown;
    for (const [tempId, defaults] of newRows) {
      const row = { ...defaults, ...draft[tempId] } as TData;
      tempIdOf.set(row as object, tempId);
      out.push(row);
    }
    if (allowAdd) out.push(trailingRow);
    return out;
  }, [
    isEditing,
    frozen,
    data,
    rowsById,
    draft,
    getRowId,
    newRows,
    tempIdOf,
    allowAdd,
    trailingRow,
  ]);

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
    getRowId: getTableRowId,
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
    // One rectangle at a time. Ctrl+click "add another range" isn't worth its confusion here.
    enableMultiCellRangeSelection: false,
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
  const colIndexById = new Map(leafColumns.map((c, i) => [c.id, i]));

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
    const reveal = pendingReveal.current;
    if (reveal) {
      const target = findCell(scrollRef.current, reveal);
      if (target) {
        pendingReveal.current = null;
        target.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      }
    }
    const key = pendingFocus.current;
    if (!key) return;
    const el = findCell(scrollRef.current, key);
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

  const isRowLocked = (rowId: string) => {
    if (!isEditing || !editing?.isRowLocked) return false;
    const saved = rowsById.get(rowId);
    return saved ? editing.isRowLocked(saved) : false;
  };
  /** The saved row, or a new row's starting values. */
  const originalRow = (rowId: string): unknown =>
    rowsById.get(rowId) ?? newRowsRef.current.get(rowId);
  /** Index of the trailing "add a row" row (= one past the last real row). */
  const trailingIndex = allowAdd ? rows.length - 1 : rows.length;
  const realRowCount = trailingIndex - newRows.size;

  /** Creates `count` new rows (temp ids, starting values) and returns their ids. */
  const addRows = (count: number) => {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const id = `tmp_${++tempSeq.current}`;
      newRowsRef.current.set(id, { ...editing?.newRow?.() });
      ids.push(id);
    }
    if (ids.length) setNewRows(new Map(newRowsRef.current));
    return ids;
  };
  const canEdit = (rowId: string, columnId: string) =>
    Boolean(table.getColumn(columnId)?.columnDef.meta?.editor) &&
    !isRowLocked(rowId);
  /** What the cell shows now: the draft value if there is one (even null), else saved. */
  const shownValue = (rowId: string, columnId: string) => {
    const rowDraft = draft[rowId];
    return rowDraft && columnId in rowDraft
      ? rowDraft[columnId]
      : fieldValue(originalRow(rowId), columnId);
  };

  // ---- The selected range ---------------------------------------------------
  // TanStack stores ranges as two corners by id: the anchor (the active cell, where
  // typing goes) and the focus (the corner Shift+arrows move). We read them as indexes.
  const range = isEditing ? cellSelection.at(-1) : undefined;
  const anchorPos = range && {
    row: rowIndexById.get(range.anchorRowId) ?? 0,
    col: colIndexById.get(range.anchorColumnId) ?? 0,
  };
  const endPos = range && {
    row: rowIndexById.get(range.focusRowId) ?? 0,
    col: colIndexById.get(range.focusColumnId) ?? 0,
  };
  const bounds: Bounds | undefined =
    anchorPos && endPos ? boundsOf(anchorPos, endPos) : undefined;
  const hasRange = bounds !== undefined && cellCount(bounds) > 1;

  /** Every (rowId, columnId) in a rectangle, row by row. */
  const cellsIn = (b: Bounds) => {
    const out: { rowId: string; columnId: string; row: number; col: number }[] =
      [];
    for (let r = b.r1; r <= b.r2; r++) {
      const rowId = rows[r]?.id;
      // The "add a row" row isn't data: clearing or filling it shouldn't create rows.
      if (rowId === undefined || rowId === NEW_ROW_ID) continue;
      for (let c = b.c1; c <= b.c2; c++) {
        const columnId = leafColumns[c]?.id;
        if (columnId !== undefined)
          out.push({ rowId, columnId, row: r, col: c });
      }
    }
    return out;
  };

  const selectRange = (
    anchor: { row: number; col: number },
    end: { row: number; col: number },
  ) => {
    const a = rows[anchor.row];
    const ac = leafColumns[anchor.col];
    const e = rows[end.row];
    const ec = leafColumns[end.col];
    if (!a || !ac || !e || !ec) return;
    setCellSelection([
      {
        anchorRowId: a.id,
        anchorColumnId: ac.id,
        focusRowId: e.id,
        focusColumnId: ec.id,
      },
    ]);
  };

  /**
   * The one way values enter the draft (typing, paste, fill, clear). Records ONE
   * history entry for the whole gesture, so one Ctrl+Z undoes it. Returns how many
   * cells actually changed.
   */
  const applyValues = (
    label: string,
    items: readonly { rowId: string; columnId: string; value: unknown }[],
  ) => {
    let next = draft;
    const changes: CellChange[] = [];
    for (const { rowId, columnId, value } of items) {
      const before = shownValue(rowId, columnId);
      if (sameValue(before, value)) continue;
      changes.push({ rowId, columnId, before, after: value });
      next = setDraftValue(
        next,
        rowId,
        columnId,
        value,
        fieldValue(originalRow(rowId), columnId),
      );
    }
    if (changes.length === 0) return 0;
    setDraft(next);
    setHistory((h) => record(h, { label, changes }));
    // The user touched these cells: the server's old messages about them no longer apply.
    setServerErrors((e) =>
      clearErrors(e, [
        ...changes,
        ...changes.map((c) => ({ rowId: c.rowId, columnId: ROW_ERROR_KEY })),
      ]),
    );
    return changes.length;
  };

  /** Undo/redo: put each changed cell back to `before` (or `after`), then show them. */
  const replay = (changes: readonly CellChange[], use: 'before' | 'after') => {
    let next = draft;
    for (const c of changes)
      next = setDraftValue(
        next,
        c.rowId,
        c.columnId,
        c[use],
        fieldValue(originalRow(c.rowId), c.columnId),
      );
    setDraft(next);
    // Select what changed, like Excel, so the user sees what was undone.
    const positions = changes
      .map((c) => ({
        row: rowIndexById.get(c.rowId),
        col: colIndexById.get(c.columnId),
      }))
      .filter(
        (p): p is { row: number; col: number } =>
          p.row !== undefined && p.col !== undefined,
      );
    const first = positions[0];
    if (!first) return;
    const box = positions.reduce(
      (b, p) => ({
        r1: Math.min(b.r1, p.row),
        r2: Math.max(b.r2, p.row),
        c1: Math.min(b.c1, p.col),
        c2: Math.max(b.c2, p.col),
      }),
      { r1: first.row, r2: first.row, c1: first.col, c2: first.col },
    );
    focusCell(box.r1, box.c1);
    selectRange({ row: box.r1, col: box.c1 }, { row: box.r2, col: box.c2 });
  };

  const undo = () => {
    const step = takeUndo(history);
    if (!step) return announce('Nothing to undo.');
    setHistory(step.history);
    replay(step.entry.changes, 'before');
    announce(`Undid ${step.entry.label}.`);
  };
  const redo = () => {
    const step = takeRedo(history);
    if (!step) return announce('Nothing to redo.');
    setHistory(step.history);
    replay(step.entry.changes, 'after');
    announce(`Redid ${step.entry.label}.`);
  };

  const clearRange = (label: string) => {
    if (!bounds) return;
    const items = cellsIn(bounds)
      .filter((c) => canEdit(c.rowId, c.columnId))
      .map((c) => ({
        ...c,
        // Text clears to "", numbers and choices to empty (null).
        value:
          table.getColumn(c.columnId)?.columnDef.meta?.editor === 'text'
            ? ''
            : null,
      }));
    const n = applyValues(label, items);
    announce(n ? `Cleared ${plural(n, 'cell')}.` : 'Nothing to clear here.');
  };

  const fillDown = () => {
    if (!bounds) return;
    const items: { rowId: string; columnId: string; value: unknown }[] = [];
    // One cell: copy the cell above (Excel). A range: copy its top row down.
    const sourceRow = bounds.r1 === bounds.r2 ? bounds.r1 - 1 : bounds.r1;
    const fromRow = rows[sourceRow];
    if (!fromRow) return announce('Nothing above to fill from.');
    const firstTarget = bounds.r1 === bounds.r2 ? bounds.r1 : bounds.r1 + 1;
    for (const c of cellsIn({ ...bounds, r1: firstTarget })) {
      if (!canEdit(c.rowId, c.columnId)) continue;
      items.push({ ...c, value: shownValue(fromRow.id, c.columnId) });
    }
    const n = applyValues('fill down', items);
    announce(n ? `Filled ${plural(n, 'cell')}.` : 'Nothing to fill.');
  };

  const focusCell = (rowIndex: number, columnIndex: number) => {
    const row = rows[rowIndex];
    const column = leafColumns[columnIndex];
    if (!row || !column) return;
    focusById(row.id, column.id, rowIndex);
  };
  /** Like focusCell, for a row that may only exist after the next render (a new row). */
  const focusById = (rowId: string, columnId: string, rowIndex: number) => {
    table.setFocusedCell(rowId, columnId);
    focusedIndex.current = rowIndex;
    pendingFocus.current = cellKey(rowId, columnId);
    virtualizer.scrollToIndex(Math.min(rowIndex, rows.length - 1), {
      align: 'auto',
    });
    // Landing on an invalid cell says why, for everyone (the footer is visible).
    const message = errors[rowId]?.[columnId];
    if (message) announce(message);
  };

  // ---- Validation ----------------------------------------------------------
  // Every row the user touched is checked against the column rules; the server's
  // messages (from a `validation` result) are layered underneath.
  const errors = useMemo(() => {
    if (!isEditing) return NO_ERRORS;
    const cols = table.getAllLeafColumns().map((c) => ({
      id: c.id,
      label: headerLabel(c),
      meta: c.columnDef.meta,
    }));
    const client = validateRows(
      Object.keys(draft),
      (id) => ({
        ...(rowsById.get(id) ?? newRowsRef.current.get(id)),
        ...draft[id],
      }),
      cols,
    );
    return mergeErrors(client, serverErrors);
    // `columns` stands in for the table's columns; newRows for newRowsRef.
  }, [isEditing, draft, serverErrors, rowsById, newRows, columns, table]);

  /** Every error as a position, in reading order (row, then column). */
  const errorList = Object.entries(errors)
    .flatMap(([rowId, cells]) =>
      Object.entries(cells).map(([key, message]) => {
        const columnId =
          key === ROW_ERROR_KEY ? (leafColumns[0]?.id ?? key) : key;
        return {
          rowId,
          columnId,
          message,
          row: rowIndexById.get(rowId) ?? Number.MAX_SAFE_INTEGER,
          col: colIndexById.get(columnId) ?? 0,
        };
      }),
    )
    .sort((a, b) => a.row - b.row || a.col - b.col);
  const errorCount = errorList.length;

  /** Moves to the next error after the active cell (wrapping round), or the first. */
  const goToError = () => {
    const here = anchorPos ?? { row: -1, col: -1 };
    const next =
      errorList.find(
        (e) => e.row > here.row || (e.row === here.row && e.col > here.col),
      ) ?? errorList[0];
    if (!next) return;
    focusById(next.rowId, next.columnId, next.row);
    announce(next.message);
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
    setFrozen({
      order: rows.map((r) => r.id),
      known: new Set(rowsById.keys()),
    });
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
    setFrozen(null);
    setEditingCell(null);
    setCellSelection([]);
    resetEdits();
    focusedIndex.current = null;
    setAnnouncement('');
    requestAnimationFrame(() => editButtonRef.current?.focus());
  };

  const startEdit = (rowId: string, columnId: string, seed?: string) => {
    if (saving) return;
    const column = table.getColumn(columnId);
    const meta = column?.columnDef.meta;
    if (!column || !meta?.editor) {
      announce(`${headerLabel(column)} is read-only.`);
      return;
    }
    // Lock on the *saved* row: changing Status to "Paid" in the draft shouldn't lock
    // the row halfway through an edit.
    if (isRowLocked(rowId)) {
      announce('This row is locked.');
      return;
    }
    if (meta.editor === 'checkbox') {
      // No editor to open: Enter, F2, Space or a click flips the value.
      if (seed !== undefined && seed !== ' ') return;
      const target = rowId === NEW_ROW_ID ? addRows(1)[0] : rowId;
      if (!target) return;
      const value = shownValue(target, columnId) !== true;
      applyValues(`toggle ${headerLabel(column)}`, [
        { rowId: target, columnId, value },
      ]);
      if (target !== rowId)
        focusById(target, columnId, rowIndexById.get(rowId) ?? 0);
      announce(`${headerLabel(column)}: ${value ? 'yes' : 'no'}.`);
      return;
    }
    const current = toEditorText(shownValue(rowId, columnId));
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
    const meta = column?.columnDef.meta;
    const raw = editorRef.current?.value ?? editingCell.initial;
    const parsed = parseEditorValue(meta?.editor ?? 'text', raw, meta?.options);
    if (!parsed.ok) {
      announce(`${headerLabel(column)}: ${parsed.message}.`);
      if (refocus) editorRef.current?.focus();
      return false;
    }
    // Typing into the "add a row" row creates a real (new) row first.
    const isAdding = rowId === NEW_ROW_ID;
    const target = isAdding ? addRows(1)[0] : rowId;
    if (target === undefined) return false;
    applyValues(`edit ${headerLabel(column)}`, [
      { rowId: target, columnId, value: parsed.value },
    ]);
    setEditingCell(null);
    if (isAdding && refocus) {
      // Stay on the new row for Tab (fill in the next field); Enter goes back to the
      // "add" row, now one lower, ready for the next record.
      const index = rowIndexById.get(rowId) ?? 0;
      const columnIndex = leafColumns.findIndex((c) => c.id === columnId);
      const nextColumn =
        leafColumns[clamp(columnIndex + dCol, leafColumns.length)]?.id ??
        columnId;
      if (dRow > 0) focusById(NEW_ROW_ID, nextColumn, index + 1);
      else focusById(target, nextColumn, index);
      return true;
    }
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
        row: anchorPos?.row ?? rowIndexById.get(focused.row.id) ?? 0,
        col: anchorPos?.col ?? colIndexById.get(focused.column.id) ?? 0,
        endRow: endPos?.row ?? rowIndexById.get(focused.row.id) ?? 0,
        endCol: endPos?.col ?? colIndexById.get(focused.column.id) ?? 0,
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
      case 'extend': {
        event.preventDefault();
        if (!anchorPos) return;
        selectRange(anchorPos, { row: action.row, col: action.col });
        // The active cell keeps focus; scroll the moving corner into view.
        const corner = rows[action.row];
        const column = leafColumns[action.col];
        if (corner && column)
          pendingReveal.current = cellKey(corner.id, column.id);
        virtualizer.scrollToIndex(action.row, { align: 'auto' });
        return;
      }
      case 'selectAll':
        event.preventDefault();
        focusCell(0, 0);
        selectRange(
          { row: 0, col: 0 },
          { row: rows.length - 1, col: leafColumns.length - 1 },
        );
        announce(
          `Selected all ${plural(rows.length * leafColumns.length, 'cell')}.`,
        );
        return;
      case 'collapse':
        event.preventDefault();
        if (anchorPos) focusCell(anchorPos.row, anchorPos.col);
        return;
      case 'clear':
        event.preventDefault();
        clearRange('clear');
        return;
      case 'fillDown':
        event.preventDefault();
        fillDown();
        return;
      case 'undo':
        event.preventDefault();
        undo();
        return;
      case 'redo':
        event.preventDefault();
        redo();
        return;
    }
  };

  // ---- Clipboard -------------------------------------------------------------
  // The copy/cut/paste DOM events are synchronous and need no permission prompt
  // (unlike navigator.clipboard). While a cell editor is open we do nothing, so the
  // input's own copy and paste work normally.
  const clipboardActive =
    isEditing && !editingCell && !saving && bounds !== undefined;

  const handleCopy = (event: ClipboardEvent<HTMLTableElement>) => {
    if (!clipboardActive || !bounds) return;
    event.preventDefault();
    const matrix: string[][] = [];
    for (let r = bounds.r1; r <= bounds.r2; r++) {
      const rowId = rows[r]?.id;
      if (rowId === undefined) continue;
      const line: string[] = [];
      for (let c = bounds.c1; c <= bounds.c2; c++) {
        const columnId = leafColumns[c]?.id;
        // Raw-ish values ("1500.5", "2026-03-01"), so a round trip through Excel is lossless.
        line.push(columnId ? toEditorText(shownValue(rowId, columnId)) : '');
      }
      matrix.push(line);
    }
    event.clipboardData.setData('text/plain', toTsv(matrix));
    // An HTML table too: Outlook, Word and Google Sheets keep the columns from this one.
    event.clipboardData.setData(
      'text/html',
      `<table>${matrix
        .map(
          (r) =>
            `<tr>${r.map((v) => `<td>${escapeHtml(v)}</td>`).join('')}</tr>`,
        )
        .join('')}</table>`,
    );
    announce(`Copied ${plural(cellCount(bounds), 'cell')}.`);
  };

  const handleCut = (event: ClipboardEvent<HTMLTableElement>) => {
    if (!clipboardActive) return;
    handleCopy(event);
    clearRange('cut');
  };

  const handlePaste = (event: ClipboardEvent<HTMLTableElement>) => {
    if (!clipboardActive || !bounds) return;
    const text = event.clipboardData.getData('text/plain');
    if (!text) return;
    event.preventDefault();
    const matrix = parseTsv(text);
    const width = Math.max(...matrix.map((r) => r.length));
    // With allowAdd, a paste may run past the last row: the extra rows become new rows.
    const plan = planPaste(
      matrix.length,
      width,
      bounds,
      allowAdd ? Number.MAX_SAFE_INTEGER : rows.length,
      leafColumns.length,
    );
    const overflow = [...new Set(plan.targets.map((t) => t.row))].filter(
      (r) => r >= trailingIndex,
    );
    const added = addRows(overflow.length);
    const rowIdAt = (r: number) =>
      r >= trailingIndex ? added[r - trailingIndex] : rows[r]?.id;

    const items: { rowId: string; columnId: string; value: unknown }[] = [];
    let skipped = 0;
    let rejected = 0;
    for (const t of plan.targets) {
      const rowId = rowIdAt(t.row);
      const column = leafColumns[t.col];
      if (rowId === undefined || !column) continue;
      if (!canEdit(rowId, column.id)) {
        skipped++;
        continue;
      }
      const meta = column.columnDef.meta;
      const parsed = parseEditorValue(
        meta?.editor ?? 'text',
        matrix[t.srcRow]?.[t.srcCol] ?? '',
        meta?.options,
      );
      if (!parsed.ok) {
        rejected++;
        continue;
      }
      items.push({ rowId, columnId: column.id, value: parsed.value });
    }
    applyValues('paste', items);
    // Count what was pasted, not what changed: pasting a value a cell already had is still a paste.
    const pasted = items.length;
    // Select the pasted area so the user sees where it went (and can Ctrl+Z it).
    const firstRow = rowIdAt(plan.area.r1);
    const lastRow = rowIdAt(plan.area.r2);
    const firstCol = leafColumns[plan.area.c1]?.id;
    const lastCol = leafColumns[plan.area.c2]?.id;
    if (firstRow && lastRow && firstCol && lastCol)
      setCellSelection([
        {
          anchorRowId: firstRow,
          anchorColumnId: firstCol,
          focusRowId: lastRow,
          focusColumnId: lastCol,
        },
      ]);
    announce(
      [
        `Pasted ${plural(pasted, 'cell')}`,
        added.length && `${plural(added.length, 'new row')}`,
        skipped && `${skipped} skipped (read-only)`,
        rejected && `${rejected} rejected (wrong type)`,
        plan.clippedRows && `${plural(plan.clippedRows, 'row')} didn't fit`,
      ]
        .filter(Boolean)
        .join(' · ') + '.',
    );
  };

  /** The row's version to send: the one from a resolved conflict wins. */
  const versionOf = (id: string, row: TData) =>
    activeOverrides?.versions[id] ?? editing?.getRowVersion?.(row);

  /** A human name for a row in messages: its first column ("INV-10004"). */
  const rowLabel = (id: string) =>
    toEditorText(fieldValue(originalRow(id), leafColumns[0]?.id ?? '')) || id;

  const save = async () => {
    if (!editing || saving) return;
    if (errorCount > 0) {
      // Blocked, but not with a disabled button: a disabled button can't say why.
      goToError();
      announce(`Fix ${plural(errorCount, 'error')} before saving.`);
      return;
    }
    const changes = toChangeSet(draft, rowsById, versionOf, newRows);
    setSaving(true);
    setSaveMessage(undefined);
    try {
      const result = await editing.onSave(changes);
      handleSaveResult(result ?? { ok: true });
    } catch {
      const message = "Couldn't save. Your changes are kept.";
      setSaveMessage(message);
      announce(message);
    } finally {
      setSaving(false);
    }
  };

  const resetEdits = () => {
    setDraft(EMPTY_DRAFT);
    setHistory(EMPTY_HISTORY);
    setServerErrors(NO_ERRORS);
    setConflicts([]);
    newRowsRef.current = new Map();
    setNewRows(NO_NEW_ROWS);
    setSaveMessage(undefined);
  };

  const handleSaveResult = (result: SaveResult) => {
    if (result.ok) {
      resetEdits();
      refocusActiveCell(); // the bar (and its button) disappears; keep the keyboard in the grid
      announce(`Saved ${plural(changeCount, 'change')}.`);
      return;
    }
    if (result.kind === 'validation') {
      // Pin the server's messages to their cells (whole-row messages go on the row).
      const pinned: Record<string, Record<string, string>> = {};
      for (const [id, { fields, row }] of Object.entries(result.rows)) {
        const cells: Record<string, string> = {};
        for (const [field, messages] of Object.entries(fields ?? {}))
          if (messages.length) cells[field] = messages.join(' ');
        if (row?.length) cells[ROW_ERROR_KEY] = row.join(' ');
        if (Object.keys(cells).length) pinned[id] = cells;
      }
      setServerErrors(pinned);
      const n = Object.keys(pinned).length;
      const message = `${plural(n, 'row')} rejected by the server. Nothing was saved.`;
      setSaveMessage(message);
      announce(message);
      // Jump to the first one, in reading order.
      const first = Object.keys(pinned)
        .map((id) => ({
          id,
          row: rowIndexById.get(id) ?? Number.MAX_SAFE_INTEGER,
        }))
        .sort((a, b) => a.row - b.row)[0];
      const firstCells = first ? pinned[first.id] : undefined;
      if (first && firstCells) {
        const key = Object.keys(firstCells)[0] ?? ROW_ERROR_KEY;
        const columnId =
          key === ROW_ERROR_KEY ? (leafColumns[0]?.id ?? key) : key;
        focusById(first.id, columnId, first.row);
      }
      return;
    }
    setConflicts(result.rows);
    const message = `${plural(result.rows.length, 'row')} changed on the server. Nothing was saved.`;
    setSaveMessage(message);
    announce(message);
  };

  /**
   * Resolves the first conflict. Both choices adopt the server's newer version for the
   * row, so the next Save isn't rejected again for the same reason.
   * - theirs: drop my changes to that row and show the server's values.
   * - mine: keep my changes; Save again overwrites the server's.
   */
  const resolveConflict = (choice: 'theirs' | 'mine') => {
    const conflict = conflicts[0];
    if (!conflict) return;
    const { id } = conflict;
    setOverrides((o) => {
      const base = o.data === data ? o : { data, rows: {}, versions: {} };
      return {
        data,
        rows:
          choice === 'theirs'
            ? { ...base.rows, [id]: conflict.current }
            : base.rows,
        versions: { ...base.versions, [id]: conflict.version },
      };
    });
    if (choice === 'theirs') {
      setDraft((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      // Undo shouldn't bring back changes the user just threw away.
      setHistory((h) => ({
        undo: h.undo
          .map((e) => ({
            ...e,
            changes: e.changes.filter((c) => c.rowId !== id),
          }))
          .filter((e) => e.changes.length > 0),
        redo: [],
      }));
      setServerErrors((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
    }
    const rest = conflicts.slice(1);
    setConflicts(rest);
    if (rest.length === 0) setSaveMessage(undefined);
    refocusActiveCell();
    announce(
      choice === 'theirs'
        ? `${rowLabel(id)}: using the server's version.`
        : `${rowLabel(id)}: keeping your changes. Save all to overwrite.`,
    );
  };

  const discard = () => {
    resetEdits();
    setEditingCell(null);
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
      onCellMouseDown: (cell, event) => {
        if ((event.target as HTMLElement).closest('[data-editor]')) return;
        // TanStack's handler does click, Shift+click (extend) and starts a drag.
        cell.getSelectionStartHandler()(event);
        const anchor = event.shiftKey ? table.getFocusedCell() : undefined;
        pendingFocus.current = anchor
          ? cellKey(anchor.row.id, anchor.column.id)
          : cellKey(cell.row.id, cell.column.id);
      },
      onCellMouseEnter: (cell, event) =>
        cell.getSelectionExtendHandler()(event),
      onCellDoubleClick: (rowId, columnId) =>
        latest.current.startEdit(rowId, columnId),
      // No seed = "toggle" for checkbox columns.
      onToggle: (rowId, columnId) => latest.current.startEdit(rowId, columnId),
      onEditorBlur: (event) => {
        // Clicking another cell or a button commits, like Excel. Moving focus inside
        // the grid via our own keys has already committed.
        if (event.currentTarget.isConnected)
          latest.current.commitEdit(0, 0, { refocus: false });
      },
    }),
    [table],
  );

  /** The first editable column carries the "Type here to add a row…" hint. */
  const hintColumnId =
    leafColumns.find((c) => c.columnDef.meta?.editor)?.id ?? null;

  /** Per-row slice of the range, as primitives so memoized rows can compare them. */
  const rowRange = (index: number) =>
    hasRange && bounds && index >= bounds.r1 && index <= bounds.r2
      ? {
          rangeStart: bounds.c1,
          rangeEnd: bounds.c2,
          rangeTop: index === bounds.r1,
          rangeBottom: index === bounds.r2,
        }
      : NO_RANGE;

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
          aria-multiselectable={isEditing || undefined}
          className={cn(
            'grid w-max min-w-full w-(--table-w) border-collapse text-sm',
            // Dragging a range shouldn't also highlight text.
            isEditing && 'select-none',
          )}
          style={cssVars({ '--table-w': `${totalWidth}px` })}
          onKeyDown={handleGridKeyDown}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
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
                    {...rowRange(item.index)}
                    rowErrors={isEditing ? errors[row.id] : undefined}
                    isNew={newRows.has(row.id)}
                    isTrailing={row.id === NEW_ROW_ID}
                    hintColumnId={hintColumnId}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (isDirty || saveMessage || conflicts.length > 0) ? (
        <SaveBar
          changeCount={changeCount}
          rowCount={changedRowCount}
          saving={saving}
          message={saveMessage}
          onSave={() => void save()}
          onDiscard={discard}
          canUndo={history.undo.length > 0}
          onUndo={undo}
          errorCount={errorCount}
          onGoToError={goToError}
          conflict={
            conflicts[0] && {
              message: conflictMessage(conflicts[0], rowLabel(conflicts[0].id)),
              remaining: conflicts.length,
            }
          }
          onUseTheirs={() => resolveConflict('theirs')}
          onKeepMine={() => resolveConflict('mine')}
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
            : `${(isEditing ? realRowCount : rows.length).toLocaleString()} rows`}
          {isEditing &&
            newRows.size > 0 &&
            ` · ${plural(newRows.size, 'new row')}`}
          {selectedCount > 0 &&
            !isEditing &&
            ` · ${selectedCount.toLocaleString()} selected`}
        </p>
        {/*
          Edit-mode messages ("Saved 3 changes", "This row is locked"). Visible, so
          sighted users get the same feedback; aria-live so screen readers hear it.
          Always rendered: a live region must exist before its text changes.
        */}
        {hasRange && bounds && (
          <p className="shrink-0 tabular-nums">
            {bounds.r2 - bounds.r1 + 1} × {bounds.c2 - bounds.c1 + 1} selected
          </p>
        )}
        <p aria-live="polite" className="ms-auto truncate text-end">
          {isEditing ? announcement : ''}
        </p>
      </div>
    </div>
  );
}

function headerLabel<TData extends RowData>(
  column: Column<DataGridFeatures, TData> | undefined,
): string {
  const header = column?.columnDef.header;
  return typeof header === 'string' ? header : (column?.id ?? 'This column');
}

/** "INV-10004 was changed by Dana at 10:42 AM." */
function conflictMessage(conflict: SaveConflict, label: string) {
  const at = conflict.at ? new Date(conflict.at) : null;
  const time =
    at && !Number.isNaN(at.getTime())
      ? at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : conflict.at;
  return `${label} was changed${conflict.by ? ` by ${conflict.by}` : ''}${
    time ? ` at ${time}` : ''
  } while you were editing.`;
}
