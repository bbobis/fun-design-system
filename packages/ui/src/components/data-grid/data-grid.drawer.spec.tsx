import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { DataGrid } from './data-grid';
import type { DataGridColumnDef } from './data-grid-features';
import type { DataGridEditing } from './editing/contract';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

// jsdom has no layout: a viewport tall enough for every row (see data-grid.editing.spec).
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
});
afterAll(() => vi.restoreAllMocks());

// Row 0 is Paid (locked when isRowLocked is set).
const rows: Invoice[] = makeInvoices(6).map((r, i) => ({
  ...r,
  customer: `Customer ${i + 1}`,
  status: i === 0 ? 'Paid' : 'Pending',
}));

function setup(
  editing: Partial<DataGridEditing<Invoice>> = {},
  columns: DataGridColumnDef<Invoice>[] = invoiceColumns,
) {
  const onSave = vi.fn(async () => ({ ok: true as const }));
  function App() {
    const [data] = useState(rows);
    return (
      <DataGrid<Invoice>
        aria-label="Invoices"
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
        editing={{ onSave, recordDrawer: true, ...editing }}
      />
    );
  }
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit table' }));
  return { onSave };
}

const press = (key: string, mods: Partial<KeyboardEventInit> = {}) =>
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key,
      ...mods,
    });
  });
const editRow = () => screen.getByRole('button', { name: 'Edit row' });
const cellText = (id: string, column: string) =>
  document.querySelector(`[data-cell-key="${id}:${column}"]`)?.textContent;

/** Row 1 (the second), then "Edit row". */
async function openRow1() {
  press('ArrowDown');
  act(() => editRow().focus());
  fireEvent.click(editRow());
  return screen.findByRole('dialog', { name: `Edit ${rows[1].number}` });
}

describe('DataGrid record drawer', () => {
  it('opens the active row as a form: editable fields, and the rest as text', async () => {
    setup();
    const drawer = await openRow1();
    expect(
      (
        within(drawer).getByRole('textbox', {
          name: /Customer/,
        }) as HTMLInputElement
      ).value,
    ).toBe('Customer 2');
    // Invoice has no editor: shown, not editable.
    expect(within(drawer).getByText('Invoice')).toBeTruthy();
    expect(within(drawer).getByText(rows[1].number)).toBeTruthy();
  });

  it('Apply writes the changes into the draft as one undo step', async () => {
    setup();
    const drawer = await openRow1();
    fireEvent.change(
      within(drawer).getByRole('textbox', { name: /Customer/ }),
      {
        target: { value: 'Acme Ltd' },
      },
    );
    fireEvent.click(within(drawer).getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(cellText(rows[1].id, 'customer')).toBe('Acme Ltd');
    expect(screen.getByText(/1 change/)).toBeTruthy();

    // Undo from the grid: the whole drawer edit goes in one step.
    const cell = document.querySelector<HTMLElement>(
      `[data-cell-key="${rows[1].id}:number"]`,
    );
    act(() => cell?.focus());
    press('z', { ctrlKey: true });
    expect(cellText(rows[1].id, 'customer')).toBe('Customer 2');
  });

  it('shows the grid’s own validation in the form', async () => {
    setup();
    const drawer = await openRow1();
    fireEvent.change(
      within(drawer).getByRole('textbox', { name: /Customer/ }),
      {
        target: { value: '' },
      },
    );
    expect(within(drawer).getByText('Customer is required')).toBeTruthy();
  });

  it('Cancel throws the form away; focus goes back to Edit row (the prediction)', async () => {
    setup();
    const drawer = await openRow1();
    fireEvent.change(
      within(drawer).getByRole('textbox', { name: /Customer/ }),
      {
        target: { value: 'Never mind' },
      },
    );
    fireEvent.click(within(drawer).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(cellText(rows[1].id, 'customer')).toBe('Customer 2');
    await waitFor(() => expect(document.activeElement).toBe(editRow()));
  });

  it('while open, the grid behind it is hidden from screen readers', async () => {
    setup();
    await openRow1();
    // React Aria's modal hides everything outside it (aria-hidden / inert).
    expect(screen.queryByRole('grid', { name: 'Invoices' })).toBeNull();
  });

  it('a locked row can’t be opened; the button says why', () => {
    setup({ isRowLocked: (r) => r.status === 'Paid' });
    // The first cell (row 0, Paid) is active after "Edit table".
    expect(editRow().getAttribute('aria-disabled')).toBe('true');
    expect(editRow().getAttribute('title')).toBe('This row is locked');
    fireEvent.click(editRow());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('meta.multiline: a multi-line box in the drawer', async () => {
    const columns = invoiceColumns.map((c) =>
      'accessorKey' in c && c.accessorKey === 'customer'
        ? { ...c, meta: { ...c.meta, multiline: true } }
        : c,
    );
    setup({}, columns);
    const drawer = await openRow1();
    expect(
      within(drawer).getByRole('textbox', { name: /Customer/ }).tagName,
    ).toBe('TEXTAREA');
  });
});
