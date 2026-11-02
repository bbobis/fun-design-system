import {
  batchMatches,
  filterSummary,
  isFilterActive,
  segmentMatches,
  type MapFilter,
} from './pipeline-filter';
import { DEMO_NETWORK } from './pipeline-map.fixtures';

/*
 * Demo pipes:
 *   A-B running     SYN, DIL
 *   B-C restricted  SWT, SYN
 *   C-D running     CON
 *   B-E shutdown    DIL
 *   C-F running     SWT, CON
 */
const matching = (filter: MapFilter) =>
  DEMO_NETWORK.segments
    .filter((s) => segmentMatches(s, filter))
    .map((s) => s.id);

describe('isFilterActive', () => {
  it('is off with no filter, or only empty lists', () => {
    expect(isFilterActive(undefined)).toBe(false);
    expect(isFilterActive({})).toBe(false);
    expect(isFilterActive({ products: [], statuses: [] })).toBe(false);
    expect(isFilterActive({ statuses: ['shutdown'] })).toBe(true);
  });
});

describe('segmentMatches', () => {
  it('products: pipes carrying at least one of them', () => {
    expect(matching({ products: ['SYN'] })).toEqual(['A-B', 'B-C']);
    expect(matching({ products: ['DIL', 'CON'] })).toEqual([
      'A-B',
      'C-D',
      'B-E',
      'C-F',
    ]);
  });

  it('statuses: pipes in any of them', () => {
    expect(matching({ statuses: ['restricted', 'shutdown'] })).toEqual([
      'B-C',
      'B-E',
    ]);
  });

  it('both lists: a pipe must match both (AND)', () => {
    expect(matching({ products: ['SYN'], statuses: ['running'] })).toEqual([
      'A-B',
    ]);
  });

  it('an empty list is no filter, not "nothing matches"', () => {
    expect(matching({ products: [] })).toHaveLength(5);
  });
});

describe('batchMatches', () => {
  it('matches by product; every batch matches without a product filter', () => {
    const syn = { name: 'B-1', product: 'SYN', volume: 1 };
    expect(batchMatches(syn, { products: ['SYN'] })).toBe(true);
    expect(batchMatches(syn, { products: ['DIL'] })).toBe(false);
    expect(batchMatches(syn, { statuses: ['shutdown'] })).toBe(true);
  });
});

describe('filterSummary', () => {
  it('counts matching pipes', () => {
    expect(filterSummary(DEMO_NETWORK, { products: ['SYN'] })).toBe(
      'Filter on: 2 of 5 pipes match.',
    );
    expect(filterSummary(DEMO_NETWORK, {})).toBe('Filter off.');
  });
});
