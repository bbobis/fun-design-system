import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { DataGrid, type DataGridProps } from './data-grid';
import type { DataGridFilters } from './column-filters';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

// jsdom has no layout: give the scroll container a fake viewport (see data-grid.spec).
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
});
afterAll(() => vi.restoreAllMocks());

const data = makeInvoices(12);
const paid = data.filter((r) => r.status === 'Paid');
const columns = invoiceColumns;

function renderGrid(props: Partial<DataGridProps<Invoice>> = {}) {
  return render(
    <DataGrid<Invoice>
      aria-label="Invoices"
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      {...props}
    />,
  );
}

const menuButton = (label: string) =>
  screen.getByRole('button', { name: `${label} column options` });
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
const status = () => screen.getByRole('status').textContent;

/** Opens a column's filter panel the way a user does: ⌄ → Filter…. */
async function openFilter(column: string) {
  act(() => menuButton(column).focus());
  fireEvent.click(menuButton(column));
  fireEvent.click(await screen.findByRole('menuitem', { name: /filter…/i }));
  return screen.findByRole('dialog', { name: `Filter ${column}` });
}

describe('DataGrid column filters', () => {
  it('list: tick values, Apply; the rows, header, chip and count follow', async () => {
    renderGrid();
    const panel = await openFilter('Status');
    fireEvent.click(within(panel).getByRole('checkbox', { name: 'Paid' }));
    fireEvent.click(within(panel).getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(status()).toBe(`${paid.length} of ${data.length} rows`);
    // The header's name says it (and nothing else: not its buttons).
    expect(
      screen.getByRole('columnheader', { name: 'Status, filtered' }),
    ).toBeTruthy();
    expect(screen.getByRole('row', { name: 'Status: Paid' })).toBeTruthy();
  });

  it('after Apply, focus goes back to the column’s ⌄ button (the prediction)', async () => {
    renderGrid();
    const panel = await openFilter('Status');
    fireEvent.click(within(panel).getByRole('checkbox', { name: 'Paid' }));
    fireEvent.click(within(panel).getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(document.activeElement).toBe(menuButton('Status')),
    );
  });

  it('text: Enter in the field applies (it is a form)', async () => {
    renderGrid();
    const panel = await openFilter('Customer');
    const contains = within(panel).getByRole('textbox', { name: 'Contains' });
    const word = data[0].customer.split(' ')[0];
    fireEvent.change(contains, { target: { value: word.toLowerCase() } });
    fireEvent.submit(contains.closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const expected = data.filter((r) =>
      r.customer.toLowerCase().includes(word.toLowerCase()),
    ).length;
    expect(status()).toBe(`${expected} of ${data.length} rows`);
  });

  it('list options come from the data when the column has none', async () => {
    renderGrid();
    const panel = await openFilter('Region');
    const regions = [...new Set(data.map((r) => r.region))].sort();
    expect(
      within(panel)
        .getAllByRole('checkbox')
        .map((c) => c.closest('label')?.textContent),
    ).toEqual(regions);
  });

  it('Clear in the panel removes that column’s filter', async () => {
    renderGrid({
      defaultFilters: { status: { kind: 'list', values: ['Paid'] } },
    });
    const panel = await openFilter('Status');
    // The panel starts from the current filter.
    expect(
      (
        within(panel).getByRole('checkbox', {
          name: 'Paid',
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    fireEvent.click(within(panel).getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect(status()).toBe(`${data.length} rows`));
  });

  it('chips: remove one, or Clear all', async () => {
    renderGrid({
      defaultFilters: {
        status: { kind: 'list', values: ['Paid'] },
        total: { kind: 'number', min: 1 },
      },
    });
    const chips = screen.getByRole('grid', { name: 'Filters' });
    expect(within(chips).getAllByRole('row')).toHaveLength(2);
    fireEvent.click(
      within(chips).getByRole('button', { name: /Remove Total/ }),
    );
    expect(within(chips).getAllByRole('row')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.queryByRole('grid', { name: 'Filters' })).toBeNull();
    expect(status()).toBe(`${data.length} rows`);
  });

  it('controlled: shows the filters it’s given and reports changes', async () => {
    const onFiltersChange = vi.fn();
    const filters: DataGridFilters = {
      status: { kind: 'list', values: ['Paid'] },
    };
    renderGrid({ filters, onFiltersChange });
    expect(status()).toBe(`${paid.length} of ${data.length} rows`);
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onFiltersChange).toHaveBeenCalledWith({});
    // Still filtered until the app passes new filters back.
    expect(status()).toBe(`${paid.length} of ${data.length} rows`);
  });

  it('while editing, filters stay but can’t be removed', () => {
    renderGrid({
      defaultFilters: { status: { kind: 'list', values: ['Paid'] } },
      editing: { onSave: () => Promise.resolve({ ok: true }) },
    });
    fireEvent.click(screen.getByRole('button', { name: /Edit table/ }));
    expect(screen.getByRole('grid', { name: 'Filters' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Remove Status/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
    // The frozen rows are still the filtered ones.
    expect(status()).toBe(`${paid.length} rows`);
  });

  it('columns without meta.filter have no Filter item', async () => {
    renderGrid();
    fireEvent.click(menuButton('Invoice'));
    await nextFrame();
    expect(screen.queryByRole('menuitem', { name: /Filter/ })).toBeNull();
  });
});
