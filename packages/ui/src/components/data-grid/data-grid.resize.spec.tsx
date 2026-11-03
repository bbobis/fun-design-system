import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { DataGrid, type DataGridProps } from './data-grid';
import { storageKeyOf } from './column-storage';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

// jsdom has no layout: give the scroll container a fake viewport (see data-grid.spec).
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
});
afterAll(() => vi.restoreAllMocks());
afterEach(() => window.localStorage.clear());

const data = makeInvoices(5);
// Invoice, Customer (size 200 in the fixture), Status, Issued.
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

const handle = (label = 'Customer') =>
  screen.getByRole('separator', { name: `Resize ${label} column` });
const width = (label = 'Customer') =>
  Number(handle(label).getAttribute('aria-valuenow'));
const menuButton = (label: string) =>
  screen.getByRole('button', { name: `${label} column options` });
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

async function choose(column: string, item: string) {
  fireEvent.click(menuButton(column));
  fireEvent.click(await screen.findByRole('menuitem', { name: item }));
  await nextFrame();
}

describe('DataGrid column resizing', () => {
  it('each header has a named resize handle with its width as a value', () => {
    renderGrid();
    const h = handle();
    expect(h.getAttribute('aria-orientation')).toBe('vertical');
    expect(width()).toBe(200);
    expect(h.getAttribute('aria-valuemin')).toBe('48');
    // Not a Tab stop: reached from the column menu (the prediction).
    expect(h.tabIndex).toBe(-1);
  });

  it('"Resize column" focuses the handle; arrows resize; Enter goes back to the ⌄ button', async () => {
    renderGrid();
    await choose('Customer', 'Resize column');
    await waitFor(() => expect(document.activeElement).toBe(handle()));
    fireEvent.keyDown(handle(), { key: 'ArrowRight' });
    expect(width()).toBe(210);
    fireEvent.keyDown(handle(), { key: 'ArrowLeft', shiftKey: true });
    expect(width()).toBe(160);
    // The header and the cells follow the new width.
    const th = screen.getByRole('columnheader', { name: /Customer/ });
    expect(th.style.getPropertyValue('--w')).toBe('160px');
    fireEvent.keyDown(handle(), { key: 'Enter' });
    expect(document.activeElement).toBe(menuButton('Customer'));
  });

  it('Home and End jump to the narrowest and widest', () => {
    renderGrid();
    fireEvent.keyDown(handle(), { key: 'Home' });
    expect(width()).toBe(48);
    fireEvent.keyDown(handle(), { key: 'End' });
    expect(width()).toBe(800);
  });

  it('dragging the edge resizes by how far the pointer moved', () => {
    const onColumnStateChange = vi.fn();
    renderGrid({ onColumnStateChange });
    fireEvent.pointerDown(handle(), { button: 0, clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientX: 560, pointerId: 1 });
    expect(width()).toBe(260);
    fireEvent.pointerUp(handle(), { pointerId: 1 });
    // After release, moving the pointer does nothing.
    fireEvent.pointerMove(handle(), { clientX: 700, pointerId: 1 });
    expect(width()).toBe(260);
    expect(onColumnStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ widths: { customer: 260 } }),
    );
  });

  it('Fit to content (and double-click) sizes the column to its widest content', async () => {
    // jsdom has no layout: pretend every cell's content is 150px wide.
    // (jsdom doesn't define Range rects at all, so add one for this test.)
    Range.prototype.getBoundingClientRect = () => ({ width: 150 }) as DOMRect;
    renderGrid();
    await choose('Customer', 'Fit to content');
    // 150 content + the cell's padding (jsdom's default 1px each side for a <td>)
    // + 2px so rounding never shows an ellipsis.
    expect(width()).toBe(154);
    fireEvent.keyDown(handle(), { key: 'End' });
    fireEvent.doubleClick(handle());
    expect(width()).toBe(154);
    // @ts-expect-error -- remove the stand-in again
    delete Range.prototype.getBoundingClientRect;
  });

  it('stateKey: remembers the layout across mounts, and Reset forgets it', async () => {
    const first = renderGrid({ stateKey: 'invoices' });
    fireEvent.keyDown(handle(), { key: 'End' });
    await choose('Status', 'Hide column');
    first.unmount();

    renderGrid({ stateKey: 'invoices' });
    expect(width()).toBe(800);
    expect(screen.queryByRole('columnheader', { name: /Status/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Reset columns' }),
    );
    await nextFrame();
    expect(width()).toBe(200);
    expect(window.localStorage.getItem(storageKeyOf('invoices'))).toBeNull();
  });

  it('a controlled columnState is never written to storage', () => {
    renderGrid({
      stateKey: 'invoices',
      columnState: {
        order: ['number', 'customer', 'status', 'issued'],
        hidden: [],
        pinned: { start: [], end: [] },
        widths: { customer: 300 },
      },
    });
    expect(width()).toBe(300);
    fireEvent.keyDown(handle(), { key: 'ArrowRight' });
    expect(window.localStorage.getItem(storageKeyOf('invoices'))).toBeNull();
  });
});
