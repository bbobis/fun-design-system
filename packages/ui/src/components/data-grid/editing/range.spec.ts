import { boundsOf, cellCount, planPaste } from './range';

const one = (row: number, col: number) => ({
  r1: row,
  r2: row,
  c1: col,
  c2: col,
});

describe('range helpers', () => {
  it('boundsOf works whichever corner is first', () => {
    expect(boundsOf({ row: 5, col: 1 }, { row: 2, col: 4 })).toEqual({
      r1: 2,
      r2: 5,
      c1: 1,
      c2: 4,
    });
    expect(cellCount({ r1: 2, r2: 5, c1: 1, c2: 4 })).toBe(16);
  });

  it('pastes a 2×3 block at the active cell', () => {
    const { targets, area } = planPaste(2, 3, one(4, 1), 100, 8);
    expect(targets).toHaveLength(6);
    expect(targets[0]).toEqual({ row: 4, col: 1, srcRow: 0, srcCol: 0 });
    expect(targets.at(-1)).toEqual({ row: 5, col: 3, srcRow: 1, srcCol: 2 });
    expect(area).toEqual({ r1: 4, r2: 5, c1: 1, c2: 3 });
  });

  it('one value onto a range fills the whole range', () => {
    const { targets } = planPaste(1, 1, { r1: 0, r2: 3, c1: 2, c2: 3 }, 100, 8);
    expect(targets).toHaveLength(8);
    expect(targets.every((t) => t.srcRow === 0 && t.srcCol === 0)).toBe(true);
  });

  it('repeats a block when the range is a whole multiple of it', () => {
    const { targets } = planPaste(2, 1, { r1: 0, r2: 5, c1: 0, c2: 0 }, 100, 8);
    expect(targets.map((t) => t.srcRow)).toEqual([0, 1, 0, 1, 0, 1]);
  });

  it('pastes once when the range is not a multiple', () => {
    const { targets } = planPaste(2, 1, { r1: 0, r2: 4, c1: 0, c2: 0 }, 100, 8);
    expect(targets).toHaveLength(2);
  });

  it('clips rows past the bottom (and counts them) and columns past the right', () => {
    const { targets, clippedRows, area } = planPaste(3, 3, one(98, 6), 100, 8);
    expect(clippedRows).toBe(1);
    expect(targets).toHaveLength(4); // rows 98–99 × cols 6–7
    expect(area).toEqual({ r1: 98, r2: 99, c1: 6, c2: 7 });
  });
});
