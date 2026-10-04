import type { RowId } from './contract';

/** One cell's change: what it showed before and after the gesture. */
export type CellChange = {
  rowId: RowId;
  columnId: string;
  before: unknown;
  after: unknown;
};

/**
 * One entry per user gesture, not per cell. A 200-cell paste is ONE entry with 200
 * changes, so one Ctrl+Z undoes the whole paste, as in Excel.
 */
export type HistoryEntry = { label: string; changes: readonly CellChange[] };

export type History = {
  undo: readonly HistoryEntry[];
  redo: readonly HistoryEntry[];
};

export const EMPTY_HISTORY: History = { undo: [], redo: [] };

/** How many gestures we remember. Old ones fall off the bottom. */
const LIMIT = 100;

/** Records a new gesture. Any redo trail is dropped (you branched off). */
export function record(history: History, entry: HistoryEntry): History {
  if (entry.changes.length === 0) return history;
  return { undo: [...history.undo, entry].slice(-LIMIT), redo: [] };
}

/** Takes the last gesture off the undo stack. The caller applies each `before`. */
export function takeUndo(
  history: History,
): { entry: HistoryEntry; history: History } | null {
  const entry = history.undo.at(-1);
  if (!entry) return null;
  return {
    entry,
    history: {
      undo: history.undo.slice(0, -1),
      redo: [...history.redo, entry],
    },
  };
}

/** Takes the last undone gesture back. The caller applies each `after`. */
export function takeRedo(
  history: History,
): { entry: HistoryEntry; history: History } | null {
  const entry = history.redo.at(-1);
  if (!entry) return null;
  return {
    entry,
    history: {
      undo: [...history.undo, entry],
      redo: history.redo.slice(0, -1),
    },
  };
}
