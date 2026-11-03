import type { DataGridFilters } from './column-filters';

/**
 * Everything the server needs to fetch one page, as one plain object. The grid
 * changes it (sort, filter, search, page) and hands it to `server.onQueryChange`; the
 * app fetches with it and passes the page back as `data`. The grid never fetches.
 */
export type DataGridQuery = {
  /** Which page, starting at 0 (like Spring's `page` and TanStack's `pageIndex`). */
  pageIndex: number;
  pageSize: number;
  /** Sort keys, most important first. Column ids = your API's field names. */
  sort: readonly { id: string; desc: boolean }[];
  /** The column filters (see `DataGridFilter`). */
  filters: DataGridFilters;
  /** The search box's text ('' for none). */
  search: string;
};

/** Turns on server mode. Pass it as `<DataGrid server={…}>`. */
export type DataGridServerOptions = {
  /** The query the shown page was (or is being) fetched with. Controlled. */
  query: DataGridQuery;
  /**
   * Called with the next query when the user sorts, filters, searches or changes page.
   * Anything that changes *which* rows match goes back to the first page.
   */
  onQueryChange: (query: DataGridQuery) => void;
  /** How many rows match the query in total, across all pages (Spring: `totalElements`). */
  rowCount: number;
  /** A fetch is running: the table is `aria-busy` and the footer says "Loading…". */
  loading?: boolean;
  /** Rows-per-page choices. @default [25, 50, 100] */
  pageSizeOptions?: readonly number[];
};

export const DEFAULT_PAGE_SIZES = [25, 50, 100] as const;

/** Wait this long after the last key before the search becomes a query. */
export const SEARCH_DEBOUNCE_MS = 300;

/** A query with nothing applied: the first page, sorted and filtered by nothing. */
export const initialQuery = (pageSize = 50): DataGridQuery => ({
  pageIndex: 0,
  pageSize,
  sort: [],
  filters: {},
  search: '',
});

/**
 * The next query after a change to what matches (sort, filters, search): always back
 * to page 0. Page 40 of the old results may not exist in the new ones, and keeping it
 * would show an empty page that says "no rows" while 120 rows match.
 */
export function narrowQuery(
  query: DataGridQuery,
  change: Partial<Pick<DataGridQuery, 'sort' | 'filters' | 'search'>>,
): DataGridQuery {
  return { ...query, ...change, pageIndex: 0 };
}

/** "51–100 of 12,450": the 1-based rows shown on the current page. */
export function pageRange(query: DataGridQuery, rowCount: number) {
  if (rowCount === 0) return { from: 0, to: 0, pageCount: 1 };
  const from = query.pageIndex * query.pageSize + 1;
  return {
    from: Math.min(from, rowCount),
    to: Math.min(from + query.pageSize - 1, rowCount),
    pageCount: Math.max(1, Math.ceil(rowCount / query.pageSize)),
  };
}
