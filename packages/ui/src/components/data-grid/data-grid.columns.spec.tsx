import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { DataGrid, type DataGridProps } from './data-grid';
import type { DataGridColumnState } from './column-state';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

// jsdom has no layout: give the scroll container a fake viewport (see data-grid.spec).
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
});
afterAll(() => vi.restoreAllMocks());

const data = makeInvoices(5);
// Invoice, Customer, Status, Issued.
const columns = invoiceColumns.slice(0, 4);

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

/** Header labels, in the order they're drawn. */
const headers = (hidden = false) =>
  screen.getAllByRole('columnheader', { hidden }).map((h) => h.textContent);
const menuButton = (label: string) =>
  screen.getByRole('button', { name: `${label} column options` });
/** React Aria opens menus and restores focus on the next animation frame. */
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

async function choose(column: string, item: string) {
  fireEvent.click(menuButton(column));
  fireEvent.click(await screen.findByRole('menuitem', { name: item }));
  await nextFrame();
}

describe('DataGrid column menu', () => {
  it('each header has a named menu button with sort, pin, move and hide', async () => {
    renderGrid();
    fireEvent.click(menuButton('Status'));
    const items = (await screen.findAllByRole('menuitem')).map(
      (i) => i.textContent,
    );
    expect(items).toEqual([
      'Sort ascending',
      'Sort descending',
      'Pin to start',
      'Pin to end',
      'Move left',
      'Move right',
      'Hide column',
    ]);
  });

  it('sorts from the menu', async () => {
    renderGrid();
    await choose('Customer', 'Sort descending');
    expect(
      screen
        .getByRole('columnheader', { name: /Customer/ })
        .getAttribute('aria-sort'),
    ).toBe('descending');
  });

  it('Move left: the header and its cells move, and focus stays on its button (the prediction)', async () => {
    const onColumnStateChange = vi.fn();
    renderGrid({ onColumnStateChange });
    act(() => menuButton('Status').focus());
    await choose('Status', 'Move left');
    expect(headers()).toEqual(['Invoice', 'Status', 'Customer', 'Issued']);
    // Same React key → same DOM node, just moved: focus is still on it.
    await waitFor(() =>
      expect(document.activeElement).toBe(menuButton('Status')),
    );
    expect(onColumnStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        order: expect.arrayContaining(['status']) as unknown,
      }),
    );
    // The cells follow: the 2nd cell of each row is now a status.
    const [, body] = screen.getAllByRole('rowgroup');
    const firstRow = within(body as HTMLElement).getAllByRole('row')[0];
    expect(within(firstRow).getAllByRole('cell')[1]?.textContent).toBe(
      data[0].status,
    );
  });

  it('Move left is off for the first column, Move right for the last', async () => {
    renderGrid();
    fireEvent.click(menuButton('Invoice'));
    expect(
      (await screen.findByRole('menuitem', { name: 'Move left' })).getAttribute(
        'aria-disabled',
      ),
    ).toBe('true');
  });

  it('Hide column: it disappears and focus goes to the next column’s button', async () => {
    renderGrid();
    act(() => menuButton('Customer').focus());
    await choose('Customer', 'Hide column');
    expect(headers()).toEqual(['Invoice', 'Status', 'Issued']);
    await waitFor(() =>
      expect(document.activeElement).toBe(menuButton('Status')),
    );
  });

  it('Pin to end: the column moves to the end and sticks there; Unpin puts it back', async () => {
    renderGrid();
    await choose('Invoice', 'Pin to end');
    expect(headers()).toEqual(['Customer', 'Status', 'Issued', 'Invoice']);
    const th = screen.getByRole('columnheader', { name: /Invoice/ });
    expect(th.className).toContain('end-(--pin)');
    await choose('Invoice', 'Unpin');
    expect(headers()).toEqual(['Invoice', 'Customer', 'Status', 'Issued']);
  });

  it('pinFirstColumn is the default layout, and the user can unpin it', async () => {
    renderGrid({ pinFirstColumn: true });
    const th = () => screen.getByRole('columnheader', { name: /Invoice/ });
    expect(th().className).toContain('start-(--pin)');
    await choose('Invoice', 'Unpin');
    expect(th().className).not.toContain('start-(--pin)');
  });

  it('Columns ▾: a checklist that shows and hides, and Reset', async () => {
    renderGrid();
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    const customer = await screen.findByRole('menuitemcheckbox', {
      name: 'Customer',
    });
    expect(customer.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(customer);
    // An open menu hides the rest of the page from screen readers (aria-hidden), so
    // read the headers including hidden ones while it's open.
    expect(headers(true)).toEqual(['Invoice', 'Status', 'Issued']);
    // The menu stays open while ticking; the hidden column stays listed, unticked.
    expect(
      screen
        .getByRole('menuitemcheckbox', { name: 'Customer' })
        .getAttribute('aria-checked'),
    ).toBe('false');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reset columns' }));
    await nextFrame();
    expect(headers()).toEqual(['Invoice', 'Customer', 'Status', 'Issued']);
  });

  it('can’t hide the last visible column', async () => {
    const only = {
      order: ['number', 'customer', 'status', 'issued'],
      hidden: ['customer', 'status', 'issued'],
      pinned: { start: [], end: [] },
    } satisfies DataGridColumnState;
    renderGrid({ defaultColumnState: only });
    fireEvent.click(menuButton('Invoice'));
    expect(
      (
        await screen.findByRole('menuitem', { name: 'Hide column' })
      ).getAttribute('aria-disabled'),
    ).toBe('true');
  });

  it('controlled: shows the layout it is given, and reports changes', async () => {
    const onColumnStateChange = vi.fn();
    const state: DataGridColumnState = {
      order: ['status', 'number', 'customer', 'issued'],
      hidden: ['issued'],
      pinned: { start: [], end: [] },
    };
    renderGrid({ columnState: state, onColumnStateChange });
    expect(headers()).toEqual(['Status', 'Invoice', 'Customer']);
    await choose('Customer', 'Hide column');
    expect(onColumnStateChange).toHaveBeenCalledWith({
      ...state,
      hidden: ['issued', 'customer'],
    });
    // Controlled: nothing changes until the app passes the new state back.
    expect(headers()).toEqual(['Status', 'Invoice', 'Customer']);
  });

  it('no column menu while editing (the layout is frozen, like sort)', () => {
    renderGrid({ editing: { onSave: () => Promise.resolve({ ok: true }) } });
    fireEvent.click(screen.getByRole('button', { name: /Edit table/ }));
    expect(screen.queryByRole('button', { name: /column options/ })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Columns' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('enableColumnMenu={false} removes both menus', () => {
    renderGrid({ enableColumnMenu: false });
    expect(screen.queryByRole('button', { name: /column options/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Columns' })).toBeNull();
  });
});
