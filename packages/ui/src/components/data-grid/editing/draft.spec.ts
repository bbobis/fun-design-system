import {
  applyDraft,
  countChanges,
  EMPTY_DRAFT,
  setDraftValue,
  toChangeSet,
} from './draft';

type Row = { id: string; name: string; total: number; version: number };
const rows: Row[] = [
  { id: 'a', name: 'Acme', total: 10, version: 3 },
  { id: 'b', name: 'Globex', total: 20, version: 7 },
];
const getRowId = (r: Row) => r.id;

describe('draft', () => {
  it('records a change and counts it', () => {
    const d = setDraftValue(EMPTY_DRAFT, 'a', 'name', 'Acme Corp', 'Acme');
    expect(d).toEqual({ a: { name: 'Acme Corp' } });
    expect(countChanges(d)).toBe(1);
  });

  it('typing the original value back makes the cell (and row) clean', () => {
    let d = setDraftValue(EMPTY_DRAFT, 'a', 'name', 'X', 'Acme');
    d = setDraftValue(d, 'a', 'name', 'Acme', 'Acme');
    expect(d).toEqual({});
    expect(countChanges(d)).toBe(0);
  });

  it('treats two Dates with the same time as unchanged', () => {
    const d = setDraftValue(
      EMPTY_DRAFT,
      'a',
      'due',
      new Date(2026, 0, 1),
      new Date(2026, 0, 1),
    );
    expect(d).toEqual({});
  });

  it('never mutates: an edit replaces only that row', () => {
    const d1 = setDraftValue(EMPTY_DRAFT, 'a', 'name', 'X', 'Acme');
    const d2 = setDraftValue(d1, 'b', 'total', 99, 20);
    expect(d1).toEqual({ a: { name: 'X' } });
    expect(d2.a).toBe(d1.a); // untouched row keeps its identity
  });

  it('applyDraft overlays changes and keeps untouched rows identical', () => {
    const d = setDraftValue(EMPTY_DRAFT, 'b', 'total', 99, 20);
    const shown = applyDraft(rows, d, getRowId);
    expect(shown[0]).toBe(rows[0]);
    expect(shown[1]).toEqual({ ...rows[1], total: 99 });
    expect(rows[1]?.total).toBe(20); // server data untouched
    expect(applyDraft(rows, EMPTY_DRAFT, getRowId)).toBe(rows);
  });

  it('toChangeSet sends only changed fields, with the row version', () => {
    let d = setDraftValue(EMPTY_DRAFT, 'b', 'total', 99, 20);
    d = setDraftValue(d, 'b', 'name', 'Globex Ltd', 'Globex');
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(toChangeSet(d, byId, (r) => r.version)).toEqual({
      operations: [
        {
          op: 'update',
          id: 'b',
          version: 7,
          changes: { total: 99, name: 'Globex Ltd' },
        },
      ],
    });
    expect(toChangeSet(d, byId).operations[0]).not.toHaveProperty('version');
  });
});
