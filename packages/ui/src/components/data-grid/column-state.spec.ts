import {
  canMove,
  defaultColumnState,
  displayOrder,
  moveColumn,
  pinColumn,
  reconcileColumnState,
  setColumnHidden,
  setColumnWidth,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  setVisibleColumns,
  toTableState,
} from './column-state';

const ids = ['a', 'b', 'c', 'd'];
const base = defaultColumnState(ids);

describe('column state', () => {
  it('default: as written, nothing hidden or pinned; pinFirst pins the first', () => {
    expect(displayOrder(base)).toEqual(ids);
    expect(defaultColumnState(ids, true).pinned.start).toEqual(['a']);
  });

  it('display order: start-pinned, scrolling, end-pinned, without hidden ones', () => {
    let s = pinColumn(base, 'c', 'start');
    s = pinColumn(s, 'a', 'end');
    s = setColumnHidden(s, 'b', true);
    expect(displayOrder(s)).toEqual(['c', 'd', 'a']);
  });

  it('moves swap with the visible neighbour, skipping hidden columns', () => {
    const s = setColumnHidden(base, 'b', true);
    expect(displayOrder(moveColumn(s, 'c', -1))).toEqual(['c', 'a', 'd']);
  });

  it('moves stay inside the pin group', () => {
    const s = pinColumn(base, 'a', 'start');
    expect(canMove(s, 'b', -1)).toBe(false); // b is the first scrolling column
    expect(canMove(s, 'a', 1)).toBe(false); // a is alone in the start group
    expect(canMove(s, 'd', 1)).toBe(false); // last column
    expect(moveColumn(s, 'b', -1)).toBe(s); // a refused move changes nothing
  });

  it('a newly pinned column goes on the inside of its group', () => {
    let s = pinColumn(base, 'a', 'start');
    s = pinColumn(s, 'c', 'start');
    expect(s.pinned.start).toEqual(['a', 'c']);
    s = pinColumn(s, 'd', 'end');
    s = pinColumn(s, 'b', 'end');
    expect(s.pinned.end).toEqual(['b', 'd']);
    expect(displayOrder(s)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('pinning to the other side moves it; null unpins', () => {
    let s = pinColumn(base, 'a', 'start');
    s = pinColumn(s, 'a', 'end');
    expect(s.pinned).toEqual({ start: [], end: ['a'] });
    expect(pinColumn(s, 'a', null).pinned).toEqual({ start: [], end: [] });
  });

  it('the checklist shows exactly the ticked columns', () => {
    expect(setVisibleColumns(base, ['a', 'd']).hidden).toEqual(['b', 'c']);
  });

  it('reconcile: drops removed columns, appends new ones, keeps the same object when nothing changed', () => {
    const saved = pinColumn(
      setColumnHidden(base, 'x' as string, true),
      'b',
      'start',
    );
    const next = reconcileColumnState(saved, ['b', 'a', 'd', 'e']);
    expect(next.order).toEqual(['a', 'b', 'd', 'e']);
    expect(next.hidden).toEqual([]);
    expect(next.pinned.start).toEqual(['b']);
    expect(reconcileColumnState(base, ids)).toBe(base);
  });

  it('toTableState: TanStack shapes, with grid-owned columns leading the start pins', () => {
    const s = setColumnHidden(pinColumn(base, 'b', 'start'), 'c', true);
    expect(toTableState(s, ['__select'])).toEqual({
      columnOrder: ['__select', 'a', 'b', 'c', 'd'],
      columnVisibility: { c: false },
      columnPinning: { start: ['__select', 'b'], end: [] },
      columnSizing: {},
    });
    // Nothing pinned at the start: the checkbox column scrolls like the rest.
    expect(toTableState(base, ['__select']).columnPinning.start).toEqual([]);
  });

  it('widths: rounded, kept between min and max, same object when unchanged', () => {
    const s = setColumnWidth(base, 'a', 180.6);
    expect(s.widths).toEqual({ a: 181 });
    expect(setColumnWidth(s, 'a', 181)).toBe(s);
    expect(setColumnWidth(base, 'a', 5).widths?.a).toBe(MIN_COLUMN_WIDTH);
    expect(setColumnWidth(base, 'a', 5000).widths?.a).toBe(MAX_COLUMN_WIDTH);
    expect(toTableState(s).columnSizing).toEqual({ a: 181 });
  });

  it('reconcile drops the widths of columns that no longer exist', () => {
    const s = setColumnWidth(setColumnWidth(base, 'a', 100), 'gone', 200);
    expect(reconcileColumnState(s, ids).widths).toEqual({ a: 100 });
  });
});
