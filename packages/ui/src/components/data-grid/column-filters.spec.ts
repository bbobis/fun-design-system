import {
  describeFilter,
  distinctValues,
  isActiveFilter,
  matchesFilter,
  setFilter,
  toColumnFilters,
  type DataGridFilter,
} from './column-filters';

describe('column filters', () => {
  it('an empty filter is inactive and lets everything through', () => {
    const empties: DataGridFilter[] = [
      { kind: 'text', contains: '  ' },
      { kind: 'number' },
      { kind: 'date' },
      { kind: 'list', values: [] },
    ];
    for (const f of empties) {
      expect(isActiveFilter(f)).toBe(false);
      expect(matchesFilter(null, f)).toBe(true);
    }
  });

  it('text: contains, ignoring case and outer spaces', () => {
    const f: DataGridFilter = { kind: 'text', contains: ' ROCK ' };
    expect(matchesFilter('Rocky Mtn Supply', f)).toBe(true);
    expect(matchesFilter('Northwind', f)).toBe(false);
    expect(matchesFilter(null, f)).toBe(false); // empty cells don't match an active filter
  });

  it('number: min and max are included; either can be left out', () => {
    expect(matchesFilter(100, { kind: 'number', min: 100, max: 200 })).toBe(
      true,
    );
    expect(matchesFilter(200, { kind: 'number', min: 100, max: 200 })).toBe(
      true,
    );
    expect(matchesFilter(201, { kind: 'number', max: 200 })).toBe(false);
    expect(matchesFilter('150', { kind: 'number', min: 100 })).toBe(true);
    expect(matchesFilter('n/a', { kind: 'number', min: 100 })).toBe(false);
  });

  it('date: ISO days compared as text, both ends included', () => {
    const q1: DataGridFilter = {
      kind: 'date',
      from: '2026-01-01',
      to: '2026-03-31',
    };
    expect(matchesFilter('2026-01-01', q1)).toBe(true);
    expect(matchesFilter('2026-03-31', q1)).toBe(true);
    expect(matchesFilter('2026-04-01', q1)).toBe(false);
    // A date-time still counts by its day.
    expect(matchesFilter('2026-03-31T23:00:00Z', q1)).toBe(true);
  });

  it('list: one of the ticked values', () => {
    const f: DataGridFilter = { kind: 'list', values: ['Paid', 'Overdue'] };
    expect(matchesFilter('Paid', f)).toBe(true);
    expect(matchesFilter('Pending', f)).toBe(false);
  });

  it('setFilter: an inactive filter removes the column', () => {
    const one = setFilter({}, 'status', { kind: 'list', values: ['Paid'] });
    expect(Object.keys(one)).toEqual(['status']);
    expect(setFilter(one, 'status', { kind: 'list', values: [] })).toEqual({});
    expect(setFilter(one, 'status', null)).toEqual({});
  });

  it('distinctValues: unique, sorted (numbers naturally), no blanks, capped', () => {
    expect(distinctValues(['West', 'East', null, '', 'West'])).toEqual([
      'East',
      'West',
    ]);
    expect(distinctValues(['Item 10', 'Item 2'])).toEqual([
      'Item 2',
      'Item 10',
    ]);
    expect(
      distinctValues(
        Array.from({ length: 500 }, (_, i) => i),
        10,
      ),
    ).toHaveLength(11);
  });

  it('describeFilter: short chip text', () => {
    expect(
      describeFilter({ kind: 'list', values: ['Paid', 'Pending', 'Draft'] }),
    ).toBe('Paid, Pending +1');
    expect(describeFilter({ kind: 'number', min: 1000, max: 5000 })).toBe(
      '1,000 – 5,000',
    );
    expect(describeFilter({ kind: 'number', max: 5000 })).toBe('≤ 5,000');
    expect(describeFilter({ kind: 'date', from: '2026-01-01' })).toBe(
      'from 2026-01-01',
    );
    expect(describeFilter({ kind: 'text', contains: 'rock ' })).toBe(
      'contains “rock”',
    );
  });

  it('toColumnFilters: TanStack’s list shape', () => {
    const f = { kind: 'text', contains: 'a' } as const;
    expect(toColumnFilters({ customer: f })).toEqual([
      { id: 'customer', value: f },
    ]);
  });
});
