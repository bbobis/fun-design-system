# DataGrid server mode

How to show a table that is too big for the browser: the server sorts, filters,
searches and pages, and the grid shows one page at a time. The grid never fetches.
It describes what the user wants as a `DataGridQuery`, and your app does the request,
the same split as `onSave` for editing.

## TL;DR

```tsx
const [query, setQuery] = useState(() => initialQuery(50));
const { data, isFetching } = useQuery({
  queryKey: ['invoices', query], // every part of the query is in the key
  queryFn: ({ signal }) => fetchInvoices(query, signal),
  placeholderData: keepPreviousData, // keep the old page on screen while the next loads
});

<DataGrid
  aria-label="Invoices"
  data={data?.content ?? EMPTY} // EMPTY = a constant [], not a new one each render
  columns={columns}
  getRowId={(r) => String(r.id)} // the database id, never the row's position
  server={{
    query,
    onQueryChange: setQuery,
    rowCount: data?.page.totalElements ?? 0,
    loading: isFetching,
  }}
/>;
```

TanStack Query is one way to fetch; `useEffect` with an `AbortController` works too
(see the `ServerMode` story).

## The query

```ts
type DataGridQuery = {
  pageIndex: number; // 0-based, like Spring's `page`
  pageSize: number;
  sort: { id: string; desc: boolean }[]; // most important first
  filters: DataGridFilters; // { status: { kind: 'list', values: ['Paid'] }, … }
  search: string;
};
```

- Column ids are your API's field names, so there's nothing to translate.
- Anything that changes **which** rows match (sort, filters, search) sends `pageIndex: 0`.
  Page 40 of the old result may not exist in the new one; staying there would show "No
  rows" while 120 rows match.
- Search is sent once typing pauses (300 ms), not on every key.
- While the user is editing, paging is frozen, like sort and filters. Save works as usual.

## A Spring Boot recipe

Map the query to Spring Data's request parameters:

```ts
export function toSpringParams(q: DataGridQuery) {
  const p = new URLSearchParams({
    page: String(q.pageIndex),
    size: String(q.pageSize),
  });
  for (const s of q.sort)
    p.append('sort', `${s.id},${s.desc ? 'desc' : 'asc'}`);
  if (q.search) p.set('q', q.search);
  for (const [id, f] of Object.entries(q.filters)) {
    switch (f.kind) {
      case 'text':
        p.set(`filter[${id}]`, `contains:${f.contains}`);
        break;
      case 'list':
        p.set(`filter[${id}]`, `in:${f.values.join(',')}`);
        break;
      case 'number':
      case 'date': {
        const [lo, hi] = f.kind === 'number' ? [f.min, f.max] : [f.from, f.to];
        if (lo !== undefined) p.append(`filter[${id}]`, `gte:${lo}`);
        if (hi !== undefined) p.append(`filter[${id}]`, `lte:${hi}`);
        break;
      }
    }
  }
  return p;
}
```

On the server:

- **Return a stable page shape.** Wrap the result in `PagedModel` (or turn on
  `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`), never `PageImpl`
  directly: Spring says its JSON can change. You get
  `{ content: [...], page: { size, number, totalElements, totalPages } }`, and
  `page.totalElements` is the grid's `rowCount`.
- **Allowlist every sort and filter key.** Spring does not check `sort` against your
  model. Keep a map of sortable / filterable fields and the operators each allows,
  build `Sort` and your `Specification` from that map only, and answer anything else
  with `400` (`application/problem+json`).
- **Count queries cost.** For very large tables, a `Slice` (no total) is cheaper; the
  grid needs a total today, so use `Page` and an index that makes `count(*)` cheap.

## What changes in server mode

| Feature        | Client mode (default)         | Server mode                                                          |
| -------------- | ----------------------------- | -------------------------------------------------------------------- |
| Sort, filter   | In the browser                | `onQueryChange` → your API                                           |
| Search         | As you type                   | After a 300 ms pause                                                 |
| Rows           | All of them, virtualized      | One page, plus a pagination bar                                      |
| Row count      | `data.length`                 | `rowCount` (the server's total)                                      |
| `list` filters | `meta.options` or data values | Give `meta.options`: one page doesn't have them all                  |
| Select all     | Every row                     | The rows on this page                                                |
| Screen readers | `aria-rowcount` = rows        | `aria-rowcount` = total; `aria-rowindex` keeps counting across pages |

The `manualSorting` / `manualFiltering` flags the grid sets on TanStack only switch the
browser's work off; they never call your backend. If sorting a column does nothing in
server mode, check that the app passes the new `query` back, and refetches with it.
