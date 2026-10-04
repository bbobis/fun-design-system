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
  /** Position of the active cell, and the size of the grid. */
  row: number;
  col: number;
  rowCount: number;
  colCount: number;
};

export type GridKeyAction =
  | { type: 'move'; row: number; col: number }
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
  const to = (row: number, col: number): GridKeyAction => ({
    type: 'move',
    row: Math.max(0, Math.min(lastRow, row)),
    col: Math.max(0, Math.min(lastCol, col)),
  });

  switch (e.key) {
    case 'ArrowUp':
      return ctrl ? to(0, ctx.col) : to(ctx.row - 1, ctx.col);
    case 'ArrowDown':
      return ctrl ? to(lastRow, ctx.col) : to(ctx.row + 1, ctx.col);
    case 'ArrowLeft':
      return ctrl ? to(ctx.row, 0) : to(ctx.row, ctx.col - 1);
    case 'ArrowRight':
      return ctrl ? to(ctx.row, lastCol) : to(ctx.row, ctx.col + 1);
    case 'Home':
      return ctrl ? to(0, 0) : to(ctx.row, 0);
    case 'End':
      return ctrl ? to(lastRow, lastCol) : to(ctx.row, lastCol);
    case 'PageUp':
      return to(ctx.row - PAGE, ctx.col);
    case 'PageDown':
      return to(ctx.row + PAGE, ctx.col);
    case 'Tab':
      // Excel habit: Tab moves along the row. At the row's edge, let Tab leave the grid
      // so keyboard users are never trapped (a documented deviation from strict APG).
      if (e.shiftKey ? ctx.col === 0 : ctx.col === lastCol)
        return { type: 'none' };
      return to(ctx.row, ctx.col + (e.shiftKey ? -1 : 1));
    case 'Enter':
    case 'F2':
      return { type: 'edit' };
  }

  // Type-to-replace: a printable key starts editing with that character.
  if (e.key.length === 1 && !ctrl && !e.altKey)
    return { type: 'edit', seed: e.key };
  return { type: 'none' };
}
