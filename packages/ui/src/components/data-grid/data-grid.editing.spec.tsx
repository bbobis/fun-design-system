import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { DataGrid } from './data-grid';
import type {
  ChangeSet,
  DataGridEditing,
  SaveResult,
} from './editing/contract';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

// jsdom has no layout: give the virtualizer a viewport so rows render (see data-grid.spec).
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
});
afterAll(() => vi.restoreAllMocks());

type Row = Invoice & { version: number };
// Fixed rows, so we know what's where. inv-1 is Paid (locked in some tests).
const rows: Row[] = makeInvoices(30).map((r, i) => ({
  ...r,
  customer: `Customer ${i + 1}`,
  status: i === 0 ? 'Paid' : 'Pending',
  subtotal: 100 + i,
  version: i,
}));
const getRowId = (r: Invoice) => r.id;

function setup(editing: Partial<DataGridEditing<Invoice>> = {}) {
  const onSave = vi.fn<(c: ChangeSet) => Promise<SaveResult | void>>(
    async () => ({ ok: true }),
  );
  function App() {
    const [data, setData] = useState<Row[]>(rows);
    return (
      <DataGrid<Invoice>
        aria-label="Invoices"
        data={data}
        columns={invoiceColumns}
        getRowId={getRowId}
        editing={{
          onSave: async (changes) => {
            const result = await onSave(changes);
            if (!result || result.ok)
              setData((prev) =>
                prev.map((r) => {
                  const op = changes.operations.find(
                    (o) => o.op === 'update' && o.id === r.id,
                  );
                  return op && op.op === 'update' ? { ...r, ...op.changes } : r;
                }),
              );
            return result;
          },
          getRowVersion: (r) => (r as Row).version,
          ...editing,
        }}
      />
    );
  }
  render(<App />);
  return { onSave };
}

const grid = () => screen.getByRole('grid', { name: 'Invoices' });
const active = () => document.activeElement as HTMLElement;
const press = (key: string, mods: Partial<KeyboardEventInit> = {}) =>
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key,
      ...mods,
    });
  });
/** Types into whatever has focus, the way type-to-replace sees it: keydown first. */
const typeKey = (ch: string) => press(ch);
const setEditorValue = (value: string) =>
  act(() => {
    fireEvent.change(active(), { target: { value } });
  });

function enterEdit() {
  act(() =>
    fireEvent.click(screen.getByRole('button', { name: 'Edit table' })),
  );
}

describe('DataGrid edit mode', () => {
  it('switches from table to grid, focuses the first cell, and shows an Editing chip', () => {
    setup();
    expect(screen.getByRole('table')).toBeTruthy();
    enterEdit();
    expect(grid()).toBeTruthy();
    expect(active().getAttribute('data-cell-key')).toBe('inv-1:number');
    expect(active().tabIndex).toBe(0);
    expect(screen.getByText('Editing')).toBeTruthy();
    // Exactly one cell is in the tab order (roving tabindex).
    expect(
      grid().querySelectorAll('[role="gridcell"][tabindex="0"]'),
    ).toHaveLength(1);
  });

  it('moves with arrows, Home/End and Tab', () => {
    setup();
    enterEdit();
    press('ArrowDown');
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:number');
    press('ArrowRight');
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:customer');
    press('Tab');
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:status');
    press('End');
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:id');
    press('Home', { ctrlKey: true });
    expect(active().getAttribute('data-cell-key')).toBe('inv-1:number');
    press('PageDown');
    expect(active().getAttribute('data-cell-key')).toBe('inv-11:number');
  });

  it('marks read-only cells and refuses to edit them', () => {
    setup();
    enterEdit();
    expect(active().getAttribute('aria-readonly')).toBe('true'); // Invoice number
    typeKey('x');
    expect(within(grid()).queryByRole('textbox')).toBeNull();
  });

  it('type-to-replace: a letter opens the editor with just that letter', () => {
    setup();
    enterEdit();
    press('ArrowDown');
    press('ArrowRight'); // inv-2 Customer
    typeKey('A');
    const input = screen.getByRole('textbox', {
      name: 'Customer',
    }) as HTMLInputElement;
    expect(input.value).toBe('A');
    expect(input.selectionStart).toBe(1); // caret after the letter, not before it
  });

  it('Enter commits and moves down; the cell shows the draft and a change count', () => {
    setup();
    enterEdit();
    press('ArrowDown');
    press('ArrowRight');
    typeKey('A');
    setEditorValue('Acme Corp');
    press('Enter');
    expect(screen.queryByRole('textbox', { name: 'Customer' })).toBeNull();
    expect(active().getAttribute('data-cell-key')).toBe('inv-3:customer');
    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('1 change')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('F2 edits the current value; Escape cancels and keeps the old value', () => {
    setup();
    enterEdit();
    press('ArrowDown');
    press('ArrowRight');
    press('F2');
    const input = screen.getByRole('textbox', {
      name: 'Customer',
    }) as HTMLInputElement;
    expect(input.value).toBe('Customer 2');
    setEditorValue('Nope');
    press('Escape');
    expect(screen.getByText('Customer 2')).toBeTruthy();
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:customer');
    expect(screen.queryByText(/change/)).toBeNull();
  });

  it('typing the original value back leaves nothing to save', () => {
    setup();
    enterEdit();
    press('ArrowDown');
    press('ArrowRight');
    typeKey('X');
    press('Enter');
    expect(screen.getByText('1 change')).toBeTruthy();
    press('ArrowUp');
    typeKey('C');
    setEditorValue('Customer 2');
    press('Enter');
    expect(screen.queryByText('1 change')).toBeNull();
  });

  it('number editor: accepts "1,500.50", keeps the editor open on "abc"', () => {
    setup();
    enterEdit();
    press('ArrowDown');
    // Subtotal is column 6 (index 5).
    for (let i = 0; i < 5; i++) press('ArrowRight');
    typeKey('a');
    setEditorValue('abc');
    press('Enter');
    expect(screen.getByRole('textbox', { name: 'Subtotal' })).toBeTruthy();
    setEditorValue('1,500.50');
    press('Enter');
    expect(screen.getByText('1,500.50')).toBeTruthy();
  });

  it('select editor: type-to-replace jumps to the first matching option', () => {
    setup();
    enterEdit();
    press('ArrowDown');
    press('ArrowRight');
    press('ArrowRight'); // Status
    typeKey('o');
    const select = screen.getByRole('combobox', {
      name: 'Status',
    }) as HTMLSelectElement;
    expect(select.value).toBe('Overdue');
    press('Tab');
    expect(within(grid()).getByText('Overdue')).toBeTruthy();
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:issued');
  });

  it('locked rows are read-only (judged on the saved row)', () => {
    setup({ isRowLocked: (r) => r.status === 'Paid' });
    enterEdit();
    press('ArrowRight'); // inv-1 is Paid
    expect(active().getAttribute('aria-readonly')).toBe('true');
    typeKey('Z');
    expect(within(grid()).queryByRole('textbox')).toBeNull();
  });

  it('Save all sends only changed fields with the row version, then clears the draft', async () => {
    const { onSave } = setup();
    enterEdit();
    press('ArrowDown');
    press('ArrowRight');
    typeKey('A');
    setEditorValue('Acme Corp');
    press('Enter');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save all' }));
    });
    expect(onSave).toHaveBeenCalledWith({
      operations: [
        {
          op: 'update',
          id: 'inv-2',
          version: 1,
          changes: { customer: 'Acme Corp' },
        },
      ],
    });
    expect(screen.queryByRole('button', { name: 'Save all' })).toBeNull();
    expect(screen.getByText('Acme Corp')).toBeTruthy(); // now from the saved data
    expect(screen.getByRole('button', { name: 'Done' })).toHaveProperty(
      'disabled',
      false,
    );
  });

  it('a failed save keeps every change and says so', async () => {
    setup({ onSave: async () => Promise.reject(new Error('503')) });
    enterEdit();
    press('ArrowDown');
    press('ArrowRight');
    typeKey('A');
    press('Enter');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save all' }));
    });
    expect(
      screen.getAllByText("Couldn't save. Your changes are kept.").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('1 change')).toBeTruthy();
  });

  it('Discard asks first, then throws the draft away', () => {
    setup();
    enterEdit();
    press('ArrowDown');
    press('ArrowRight');
    typeKey('A');
    press('Enter');
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Discard' })));
    expect(screen.getByText('Discard 1 change?')).toBeTruthy();
    expect(active().textContent).toBe('Keep editing'); // safe choice gets focus
    // Only the confirm button is called Discard now.
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Discard' })));
    expect(screen.queryByText(/change/)).toBeNull();
    expect(screen.getByText('Customer 2')).toBeTruthy();
  });

  it('freezes sorting while editing and restores it after Done', () => {
    setup();
    act(() =>
      fireEvent.click(
        within(
          screen.getByRole('columnheader', { name: /Customer/ }),
        ).getByRole('button'),
      ),
    );
    enterEdit();
    expect(
      within(
        screen.getByRole('columnheader', { name: /Customer/ }),
      ).queryByRole('button'),
    ).toBeNull();
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Done' })));
    expect(
      screen
        .getByRole('columnheader', { name: /Customer/ })
        .getAttribute('aria-sort'),
    ).toBe('ascending');
  });

  it('warns before leaving the page only while there are unsaved changes', () => {
    setup();
    enterEdit();
    const event = () => {
      const e = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(event()).toBe(false);
    press('ArrowDown');
    press('ArrowRight');
    typeKey('A');
    press('Enter');
    expect(event()).toBe(true);
  });
});
