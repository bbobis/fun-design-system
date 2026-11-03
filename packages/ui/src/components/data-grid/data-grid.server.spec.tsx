import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { DataGrid } from './data-grid';
import { queryInvoices } from './fixtures/fake-server';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';
import { initialQuery, type DataGridQuery } from './server-query';

// jsdom has no layout: give the scroll container a fake viewport (see data-grid.spec).
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
});
afterAll(() => vi.restoreAllMocks());

const all = makeInvoices(120);

/** An app that "fetches" synchronously from the fake server, and logs every query. */
function setup(start: Partial<DataGridQuery> = {}) {
  const queries: DataGridQuery[] = [];
  function App() {
    const [query, setQuery] = useState<DataGridQuery>({
      ...initialQuery(25),
      ...start,
    });
    const page = queryInvoices(all, query);
    return (
      <DataGrid<Invoice>
        aria-label="Invoices"
        data={page.content}
        columns={invoiceColumns}
        getRowId={(r) => r.id}
        server={{
          query,
          onQueryChange: (q) => {
            queries.push(q);
            setQuery(q);
          },
          rowCount: page.page.totalElements,
        }}
      />
    );
  }
  render(<App />);
  return { queries, last: () => queries.at(-1) };
}

const status = () => screen.getByRole('status').textContent;
const firstCell = () =>
  within(screen.getAllByRole('rowgroup')[1] as HTMLElement).getAllByRole(
    'cell',
  )[0]?.textContent;

describe('DataGrid server mode', () => {
  it('shows the page it was given, the server total, and a pagination bar', () => {
    setup();
    expect(status()).toBe('1–25 of 120 rows');
    expect(screen.getByRole('table').getAttribute('aria-rowcount')).toBe('121');
    expect(
      screen.getByRole('navigation', { name: 'Invoices pages' }),
    ).toBeTruthy();
  });

  it('paging asks for the next page; aria-rowindex keeps counting', () => {
    const { last } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(last()?.pageIndex).toBe(1);
    expect(status()).toBe('26–50 of 120 rows');
    expect(firstCell()).toBe(all[25].number);
    // Row 26 of the result (+1 for the header row).
    const [, body] = screen.getAllByRole('rowgroup');
    expect(
      within(body as HTMLElement)
        .getAllByRole('row')[0]
        ?.getAttribute('aria-rowindex'),
    ).toBe('27');
  });

  it('sorting is the server’s job: the query changes and goes back to page 0', () => {
    const { last } = setup({ pageIndex: 3 });
    fireEvent.click(
      within(screen.getByRole('columnheader', { name: 'Total' })).getAllByRole(
        'button',
      )[0] as HTMLElement,
    );
    expect(last()).toMatchObject({
      sort: [{ id: 'total', desc: false }],
      pageIndex: 0,
    });
  });

  it('the grid does not re-sort the page itself (manualSorting)', () => {
    // A query sorted by total, but the "server" returns rows unsorted.
    function App() {
      return (
        <DataGrid<Invoice>
          aria-label="Invoices"
          data={all.slice(0, 5)}
          columns={invoiceColumns}
          getRowId={(r) => r.id}
          server={{
            query: { ...initialQuery(5), sort: [{ id: 'number', desc: true }] },
            onQueryChange: () => undefined,
            rowCount: 5,
          }}
        />
      );
    }
    render(<App />);
    expect(firstCell()).toBe(all[0].number); // the order it was given
  });

  it('search waits for a pause in typing, then asks for page 0', async () => {
    vi.useFakeTimers();
    const { queries } = setup({ pageIndex: 2 });
    const box = screen.getByRole('searchbox', { name: 'Search Invoices' });
    fireEvent.change(box, { target: { value: 'r' } });
    fireEvent.change(box, { target: { value: 'ro' } });
    fireEvent.change(box, { target: { value: 'roc' } });
    expect(queries).toHaveLength(0);
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatchObject({ search: 'roc', pageIndex: 0 });
    vi.useRealTimers();
  });

  it('a filter becomes part of the query (and back to page 0)', () => {
    const { last } = setup({
      pageIndex: 2,
      filters: { status: { kind: 'list', values: ['Paid'] } },
    });
    expect(screen.getByRole('grid', { name: 'Filters' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(last()).toMatchObject({ filters: {}, pageIndex: 0 });
  });

  it('loading: the table is busy and the footer says so', () => {
    render(
      <DataGrid<Invoice>
        aria-label="Invoices"
        data={[]}
        columns={invoiceColumns}
        getRowId={(r) => r.id}
        server={{
          query: initialQuery(25),
          onQueryChange: () => undefined,
          rowCount: 0,
          loading: true,
        }}
      />,
    );
    expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('true');
    expect(status()).toBe('Loading…');
  });
});
