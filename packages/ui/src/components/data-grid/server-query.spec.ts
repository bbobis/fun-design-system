import { initialQuery, narrowQuery, pageRange } from './server-query';

describe('server query', () => {
  it('narrowing (sort, filters, search) always goes back to the first page (the prediction)', () => {
    const onPage40 = { ...initialQuery(50), pageIndex: 39 };
    const next = narrowQuery(onPage40, {
      filters: { status: { kind: 'list', values: ['Paid'] } },
    });
    expect(next.pageIndex).toBe(0);
    expect(next.pageSize).toBe(50);
    expect(narrowQuery(onPage40, { search: 'rock' }).pageIndex).toBe(0);
    expect(
      narrowQuery(onPage40, { sort: [{ id: 'total', desc: true }] }).pageIndex,
    ).toBe(0);
  });

  it('pageRange: 1-based rows shown, the last page cut short, and an empty result', () => {
    const q = { ...initialQuery(50), pageIndex: 1 };
    expect(pageRange(q, 12_450)).toEqual({ from: 51, to: 100, pageCount: 249 });
    expect(pageRange({ ...q, pageIndex: 2 }, 120)).toEqual({
      from: 101,
      to: 120,
      pageCount: 3,
    });
    expect(pageRange(q, 0)).toEqual({ from: 0, to: 0, pageCount: 1 });
  });
});
