import {
  EMPTY_HISTORY,
  record,
  takeRedo,
  takeUndo,
  type History,
  type HistoryEntry,
} from './history';

/** takeUndo/takeRedo return null when empty; these tests expect a value. */
function must<T>(value: T | null): T {
  if (value === null) throw new Error('expected a history entry');
  return value;
}
const undo = (h: History) => must(takeUndo(h));
const redo = (h: History) => must(takeRedo(h));

const paste: HistoryEntry = {
  label: 'paste',
  changes: [
    { rowId: 'a', columnId: 'x', before: 1, after: 2 },
    { rowId: 'b', columnId: 'x', before: 3, after: 4 },
  ],
};
const edit: HistoryEntry = {
  label: 'edit',
  changes: [{ rowId: 'a', columnId: 'y', before: 'p', after: 'q' }],
};

describe('history', () => {
  it('a multi-cell gesture is one undo step', () => {
    const h = record(EMPTY_HISTORY, paste);
    const u = takeUndo(h);
    expect(u?.entry).toBe(paste);
    expect(u?.history.undo).toHaveLength(0);
  });

  it('undo then redo returns the same entry', () => {
    let h = record(record(EMPTY_HISTORY, paste), edit);
    const u = undo(h);
    expect(u.entry).toBe(edit);
    h = u.history;
    const r = redo(h);
    expect(r.entry).toBe(edit);
    expect(r.history.undo).toEqual([paste, edit]);
  });

  it('a new gesture after undo clears the redo trail', () => {
    let h = record(record(EMPTY_HISTORY, paste), edit);
    h = undo(h).history;
    h = record(h, {
      label: 'other',
      changes: [{ rowId: 'c', columnId: 'z', before: 0, after: 1 }],
    });
    expect(takeRedo(h)).toBeNull();
  });

  it('ignores empty gestures and has nothing to undo at the start', () => {
    expect(record(EMPTY_HISTORY, { label: 'noop', changes: [] })).toBe(
      EMPTY_HISTORY,
    );
    expect(takeUndo(EMPTY_HISTORY)).toBeNull();
  });
});
