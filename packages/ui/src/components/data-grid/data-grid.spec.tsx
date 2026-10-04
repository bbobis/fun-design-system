import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import { DataGrid } from './data-grid';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

// jsdom has no layout engine: every element is 0px tall, so the virtualizer would
// render no rows. TanStack Virtual reads offsetHeight/offsetWidth, so give the scroll
// container a fake 600×1000 viewport for these tests.
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
});
afterAll(() => vi.restoreAllMocks());

const tenThousand = makeInvoices(10_000);
const small = tenThousand.slice(0, 5);
const getRowId = (row: Invoice) => row.id;

function renderGrid(
  props: Partial<Parameters<typeof DataGrid<Invoice>>[0]> = {},
) {
  return render(
    <DataGrid<Invoice>
      aria-label="Invoices"
      data={tenThousand}
      columns={invoiceColumns}
      getRowId={getRowId}
      {...props}
    />,
  );
}

/** Data rows currently in the DOM (excludes the header row). */
function bodyRows() {
  const [, body] = screen.getAllByRole('rowgroup');
  return within(body as HTMLElement).queryAllByRole('row');
}

/** Reads the visible text of a column in the rendered rows. */
function columnText(colIndex: number) {
  return bodyRows().map(
    (r) => within(r).getAllByRole('cell')[colIndex]?.textContent,
  );
}

describe('DataGrid', () => {
  it('renders only a window of rows, not all 10,000', () => {
    renderGrid();
    const count = bodyRows().length;
    expect(count).toBeGreaterThan(10);
    expect(count).toBeLessThan(60);
  });

  it('tells assistive tech the full size: aria-rowcount and aria-rowindex', () => {
    renderGrid();
    const table = screen.getByRole('table', { name: 'Invoices' });
    expect(table.getAttribute('aria-rowcount')).toBe('10001'); // + header row
    expect(table.getAttribute('aria-colcount')).toBe('20');
    expect(bodyRows()[0]?.getAttribute('aria-rowindex')).toBe('2');
  });

  it('makes the scroll area keyboard-focusable and named', () => {
    renderGrid();
    const region = screen.getByRole('region', { name: 'Invoices' });
    expect(region.tabIndex).toBe(0);
  });

  it('sorts when a header button is clicked, and marks the header with aria-sort', () => {
    renderGrid({ data: small });
    const header = screen.getByRole('columnheader', { name: /Customer/ });
    expect(header.hasAttribute('aria-sort')).toBe(false);

    act(() => fireEvent.click(within(header).getByRole('button')));
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    const asc = columnText(1);
    expect(asc).toHaveLength(5); // guard: an empty list would "pass" any sort check
    expect(asc).toEqual(
      [...asc].sort((a, b) => (a ?? '').localeCompare(b ?? '')),
    );

    act(() => fireEvent.click(within(header).getByRole('button')));
    expect(header.getAttribute('aria-sort')).toBe('descending');
  });

  it('sorts numbers numerically, not as text', () => {
    renderGrid({ data: small });
    const header = screen.getByRole('columnheader', { name: /^Items/ });
    act(() => fireEvent.click(within(header).getByRole('button')));
    const items = columnText(16).map(Number);
    expect(items).toHaveLength(5);
    expect(items).toEqual([...items].sort((a, b) => a - b));
  });

  it('filters across all columns and announces the result count', async () => {
    renderGrid();
    const search = screen.getByRole('searchbox', { name: 'Search Invoices' });
    await act(async () =>
      fireEvent.change(search, { target: { value: 'INV-10042' } }),
    );
    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe('1 of 10,000 rows');
  });

  it('shows a helpful message when nothing matches', async () => {
    renderGrid({ data: small });
    await act(async () =>
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'zzz-no-match' },
      }),
    );
    expect(screen.getByText('No rows match "zzz-no-match".')).toBeTruthy();
  });

  it('shows the title, the total count and toolbar actions', () => {
    renderGrid({
      title: 'Open invoices',
      toolbarActions: <button type="button">New invoice</button>,
    });
    expect(screen.getByText('Open invoices')).toBeTruthy();
    expect(screen.getByText('10,000')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New invoice' })).toBeTruthy();
  });

  it('hides the header bar with showToolbar={false}', () => {
    renderGrid({ showToolbar: false });
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('10,000 rows');
  });

  it('shows the empty message when there is no data', () => {
    renderGrid({ data: [], emptyMessage: 'No invoices yet.' });
    expect(screen.getByText('No invoices yet.')).toBeTruthy();
  });

  describe('row selection', () => {
    it('labels every checkbox and selects one row', () => {
      renderGrid({ data: small, enableRowSelection: true });
      const box = screen.getByRole('checkbox', { name: 'Select row inv-2' });
      act(() => fireEvent.click(box));
      expect((box as HTMLInputElement).checked).toBe(true);
      expect(screen.getByRole('status').textContent).toContain('1 selected');
    });

    it('select-all becomes mixed with some rows, and selects every row (including unrendered ones)', () => {
      renderGrid({ enableRowSelection: true });
      const all = screen.getByRole('checkbox', {
        name: 'Select all rows',
      }) as HTMLInputElement;
      act(() =>
        fireEvent.click(
          screen.getByRole('checkbox', { name: 'Select row inv-1' }),
        ),
      );
      expect(all.indeterminate).toBe(true);

      act(() => fireEvent.click(all));
      expect(all.indeterminate).toBe(false);
      expect(screen.getByRole('status').textContent).toContain(
        '10,000 selected',
      );
    });

    it('shows the bulk-action bar only while rows are selected', () => {
      const renderBulkActions = vi.fn(({ selectedRowIds }) => (
        <button type="button">Export {selectedRowIds.length}</button>
      ));
      renderGrid({ data: small, enableRowSelection: true, renderBulkActions });
      expect(
        screen.queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
      expect(renderBulkActions).not.toHaveBeenCalled();

      act(() =>
        fireEvent.click(
          screen.getByRole('checkbox', { name: 'Select row inv-2' }),
        ),
      );
      act(() =>
        fireEvent.click(
          screen.getByRole('checkbox', { name: 'Select row inv-4' }),
        ),
      );
      expect(screen.getByRole('button', { name: 'Export 2' })).toBeTruthy();
      expect(renderBulkActions).toHaveBeenLastCalledWith(
        expect.objectContaining({ selectedRowIds: ['inv-2', 'inv-4'] }),
      );
    });

    it('"Clear selection" empties the selection and moves focus back to the grid', () => {
      renderGrid({ data: small, enableRowSelection: true });
      act(() =>
        fireEvent.click(
          screen.getByRole('checkbox', { name: 'Select row inv-1' }),
        ),
      );
      const clear = screen.getByRole('button', { name: 'Clear selection' });
      clear.focus();
      act(() => fireEvent.click(clear));
      expect(
        screen.queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
      expect(screen.getByRole('status').textContent).toBe('5 rows');
      expect(document.activeElement).toBe(
        screen.getByRole('region', { name: 'Invoices' }),
      );
    });

    it('works with selection owned by the app (controlled)', () => {
      function Controlled() {
        const [selection, setSelection] = useState<RowSelectionState>({
          'inv-3': true,
        });
        return (
          <>
            <DataGrid<Invoice>
              aria-label="Invoices"
              data={small}
              columns={invoiceColumns}
              getRowId={getRowId}
              enableRowSelection
              rowSelection={selection}
              onRowSelectionChange={setSelection}
            />
            <output data-testid="app">
              {Object.keys(selection).join(',')}
            </output>
          </>
        );
      }
      render(<Controlled />);
      expect(
        (
          screen.getByRole('checkbox', {
            name: 'Select row inv-3',
          }) as HTMLInputElement
        ).checked,
      ).toBe(true);
      act(() =>
        fireEvent.click(
          screen.getByRole('checkbox', { name: 'Select row inv-1' }),
        ),
      );
      expect(screen.getByTestId('app').textContent).toBe('inv-3,inv-1');
    });
  });
});
