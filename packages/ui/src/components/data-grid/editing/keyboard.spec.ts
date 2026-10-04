import { getGridKeyAction, type GridKeyEvent } from './keyboard';

const key = (k: string, mods: Partial<GridKeyEvent> = {}): GridKeyEvent => ({
  key: k,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  isComposing: false,
  ...mods,
});
// A 100-row × 8-column grid, active cell at row 5, column 3.
const nav = { editing: false, row: 5, col: 3, rowCount: 100, colCount: 8 };
const editing = { ...nav, editing: true };

describe('getGridKeyAction: navigation mode', () => {
  it.each([
    ['ArrowUp', {}, 4, 3],
    ['ArrowDown', {}, 6, 3],
    ['ArrowLeft', {}, 5, 2],
    ['ArrowRight', {}, 5, 4],
    ['ArrowUp', { ctrlKey: true }, 0, 3],
    ['ArrowDown', { ctrlKey: true }, 99, 3],
    ['ArrowRight', { metaKey: true }, 5, 7],
    ['Home', {}, 5, 0],
    ['End', {}, 5, 7],
    ['Home', { ctrlKey: true }, 0, 0],
    ['End', { ctrlKey: true }, 99, 7],
    ['PageDown', {}, 15, 3],
    ['PageUp', {}, 0, 3], // clamped, no wrap
    ['Tab', {}, 5, 4],
    ['Tab', { shiftKey: true }, 5, 2],
  ] as const)('%s %o moves to (%i, %i)', (k, mods, row, col) => {
    expect(getGridKeyAction(key(k, mods), nav)).toEqual({
      type: 'move',
      row,
      col,
    });
  });

  it('does not move past the edges', () => {
    const corner = { ...nav, row: 0, col: 0 };
    expect(getGridKeyAction(key('ArrowUp'), corner)).toEqual({
      type: 'move',
      row: 0,
      col: 0,
    });
    expect(getGridKeyAction(key('ArrowLeft'), corner)).toEqual({
      type: 'move',
      row: 0,
      col: 0,
    });
  });

  it('lets Tab leave the grid at the end of a row (no keyboard trap)', () => {
    expect(getGridKeyAction(key('Tab'), { ...nav, col: 7 })).toEqual({
      type: 'none',
    });
    expect(
      getGridKeyAction(key('Tab', { shiftKey: true }), { ...nav, col: 0 }),
    ).toEqual({
      type: 'none',
    });
  });

  it('Enter and F2 edit the current value; a printable key replaces it', () => {
    expect(getGridKeyAction(key('Enter'), nav)).toEqual({ type: 'edit' });
    expect(getGridKeyAction(key('F2'), nav)).toEqual({ type: 'edit' });
    expect(getGridKeyAction(key('a'), nav)).toEqual({
      type: 'edit',
      seed: 'a',
    });
    expect(getGridKeyAction(key('7'), nav)).toEqual({
      type: 'edit',
      seed: '7',
    });
  });

  it('leaves shortcuts and IME composition alone', () => {
    expect(getGridKeyAction(key('c', { ctrlKey: true }), nav)).toEqual({
      type: 'none',
    });
    expect(getGridKeyAction(key('a', { isComposing: true }), nav)).toEqual({
      type: 'none',
    });
    expect(getGridKeyAction(key('Shift'), nav)).toEqual({ type: 'none' });
  });
});

describe('getGridKeyAction: editing mode', () => {
  it('Enter / Tab commit and move like Excel; Shift reverses', () => {
    expect(getGridKeyAction(key('Enter'), editing)).toEqual({
      type: 'commit',
      dRow: 1,
      dCol: 0,
    });
    expect(getGridKeyAction(key('Enter', { shiftKey: true }), editing)).toEqual(
      {
        type: 'commit',
        dRow: -1,
        dCol: 0,
      },
    );
    expect(getGridKeyAction(key('Tab'), editing)).toEqual({
      type: 'commit',
      dRow: 0,
      dCol: 1,
    });
  });

  it('Escape cancels; everything else belongs to the input', () => {
    expect(getGridKeyAction(key('Escape'), editing)).toEqual({
      type: 'cancel',
    });
    expect(getGridKeyAction(key('ArrowLeft'), editing)).toEqual({
      type: 'none',
    });
    expect(getGridKeyAction(key('z', { ctrlKey: true }), editing)).toEqual({
      type: 'none',
    });
  });
});
