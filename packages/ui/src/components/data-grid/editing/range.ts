/** A rectangle of cells, by row and column index (inclusive). */
export type Bounds = { r1: number; r2: number; c1: number; c2: number };

export type Position = { row: number; col: number };

/** The rectangle spanned by two corners, whichever way round they are. */
export function boundsOf(a: Position, b: Position): Bounds {
  return {
    r1: Math.min(a.row, b.row),
    r2: Math.max(a.row, b.row),
    c1: Math.min(a.col, b.col),
    c2: Math.max(a.col, b.col),
  };
}

export const cellCount = (b: Bounds) => (b.r2 - b.r1 + 1) * (b.c2 - b.c1 + 1);

/** One planned paste: grid cell (row, col) gets clipboard cell [srcRow][srcCol]. */
export type PasteTarget = Position & { srcRow: number; srcCol: number };

/**
 * Where each clipboard value lands. Excel's rules:
 * - The paste starts at the top-left of the selection.
 * - If the selection is a whole multiple of the clipboard block (including a single
 *   value onto many cells), the block repeats to fill it.
 * - Otherwise the block is pasted once, at its own size.
 * Anything past the last row or column is clipped and counted.
 */
export function planPaste(
  height: number,
  width: number,
  selection: Bounds,
  rowCount: number,
  colCount: number,
): { targets: PasteTarget[]; clippedRows: number; area: Bounds } {
  const selH = selection.r2 - selection.r1 + 1;
  const selW = selection.c2 - selection.c1 + 1;
  const tiles =
    selH % height === 0 &&
    selW % width === 0 &&
    (selH > height || selW > width);
  const fillH = tiles ? selH : height;
  const fillW = tiles ? selW : width;

  const targets: PasteTarget[] = [];
  let clippedRows = 0;
  for (let i = 0; i < fillH; i++) {
    const row = selection.r1 + i;
    if (row >= rowCount) {
      clippedRows++;
      continue;
    }
    for (let j = 0; j < fillW; j++) {
      const col = selection.c1 + j;
      if (col >= colCount) continue;
      targets.push({ row, col, srcRow: i % height, srcCol: j % width });
    }
  }
  const area: Bounds = {
    r1: selection.r1,
    c1: selection.c1,
    r2: Math.min(rowCount - 1, selection.r1 + fillH - 1),
    c2: Math.min(colCount - 1, selection.c1 + fillW - 1),
  };
  return { targets, clippedRows, area };
}
