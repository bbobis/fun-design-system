/**
 * The edit-mode keymap as one pure function: key event in, action out. No DOM, no
 * React, so every key is a one-line unit test, and the grid's handler stays a `switch`.
 *
 * Two modes, from the WAI-ARIA grid pattern:
 * - navigation: focus is on a cell; arrows move, typing starts an edit.
 * - editing: focus is in the cell's input; it owns most keys, we only take
 *   Enter / Tab / Escape to commit or cancel.
 */

export type GridKeyEvent = {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  /** True while an IME (Chinese, Japanese…) is composing; never steal those keys. */
  isComposing: boolean;
};

export type GridKeyContext = {
  editing: boolean;
  /** The active cell (where typing goes). It stays put while Shift extends a range. */
  row: number;
  col: number;
  /** The moving corner of the selected range. Equals row/col when one cell is selected. */
  endRow: number;
  endCol: number;
  rowCount: number;
  colCount: number;
};

export type GridKeyAction =
  | { type: 'move'; row: number; col: number }
  /** Shift+arrow etc.: keep the active cell, move the range's other corner. */
  | { type: 'extend'; row: number; col: number }
  | { type: 'selectAll' }
  /** Esc with a range: back to just the active cell. */
  | { type: 'collapse' }
  /** Delete: clear every editable cell in the range. */
  | { type: 'clear' }
  /** Ctrl+D: copy the top row of the range down (or the cell above, for one cell). */
  | { type: 'fillDown' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'edit'; seed?: string }
  | { type: 'commit'; dRow: number; dCol: number }
  | { type: 'cancel' }
  /** Not ours: don't preventDefault, let the browser or the input handle it. */
  | { type: 'none' };

const PAGE = 10;

export function getGridKeyAction(
  e: GridKeyEvent,
  ctx: GridKeyContext,
): GridKeyAction {
  if (e.isComposing) return { type: 'none' };
  const ctrl = e.ctrlKey || e.metaKey;

  if (ctx.editing) {
    switch (e.key) {
      case 'Escape':
        return { type: 'cancel' };
      case 'Enter':
        return { type: 'commit', dRow: e.shiftKey ? -1 : 1, dCol: 0 };
      case 'Tab':
        return { type: 'commit', dRow: 0, dCol: e.shiftKey ? -1 : 1 };
      default:
        return { type: 'none' }; // the input handles typing, caret keys, its own undo
    }
  }

  const lastRow = ctx.rowCount - 1;
  const lastCol = ctx.colCount - 1;
  const hasRange = ctx.endRow !== ctx.row || ctx.endCol !== ctx.col;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (ctrl && !e.altKey) {
    if (key === 'z') return e.shiftKey ? { type: 'redo' } : { type: 'undo' };
    if (key === 'y') return { type: 'redo' };
    if (key === 'd') return { type: 'fillDown' };
    if (key === 'a') return { type: 'selectAll' };
  }

  // Shift extends from the range's moving corner; without Shift, moves from the active cell.
  const extend = e.shiftKey && e.key !== 'Tab';
  const fromRow = extend ? ctx.endRow : ctx.row;
  const fromCol = extend ? ctx.endCol : ctx.col;
  const to = (row: number, col: number): GridKeyAction => ({
    type: extend ? 'extend' : 'move',
    row: Math.max(0, Math.min(lastRow, row)),
    col: Math.max(0, Math.min(lastCol, col)),
  });

  switch (e.key) {
    case 'ArrowUp':
      return ctrl ? to(0, fromCol) : to(fromRow - 1, fromCol);
    case 'ArrowDown':
      return ctrl ? to(lastRow, fromCol) : to(fromRow + 1, fromCol);
    case 'ArrowLeft':
      return ctrl ? to(fromRow, 0) : to(fromRow, fromCol - 1);
    case 'ArrowRight':
      return ctrl ? to(fromRow, lastCol) : to(fromRow, fromCol + 1);
    case 'Home':
      return ctrl ? to(0, 0) : to(fromRow, 0);
    case 'End':
      return ctrl ? to(lastRow, lastCol) : to(fromRow, lastCol);
    case 'PageUp':
      return to(fromRow - PAGE, fromCol);
    case 'PageDown':
      return to(fromRow + PAGE, fromCol);
    case 'Tab':
      // Excel habit: Tab moves along the row. At the row's edge, let Tab leave the grid
      // so keyboard users are never trapped (a documented deviation from strict APG).
      if (e.shiftKey ? ctx.col === 0 : ctx.col === lastCol)
        return { type: 'none' };
      return to(ctx.row, ctx.col + (e.shiftKey ? -1 : 1));
    case 'Enter':
    case 'F2':
      return { type: 'edit' };
    case 'Escape':
      return hasRange ? { type: 'collapse' } : { type: 'none' };
    case 'Delete':
      return { type: 'clear' };
    case 'Backspace':
      // Excel: Backspace empties the active cell and starts editing it.
      return { type: 'edit', seed: '' };
  }

  // Type-to-replace: a printable key starts editing with that character.
  if (e.key.length === 1 && !ctrl && !e.altKey)
    return { type: 'edit', seed: e.key };
  return { type: 'none' };
}
