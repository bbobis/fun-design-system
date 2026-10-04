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
// Tall enough for all 30 rows + the "add a row" row: jsdom can't scroll, so a row that
// starts off screen would never mount, and focus or paste tests near the bottom would fail.
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(1200);
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

describe('DataGrid edit mode: Excel feel', () => {
  /** Puts the active cell on (row index, column index) from the top-left. */
  function goTo(row: number, col: number) {
    press('Home', { ctrlKey: true });
    for (let i = 0; i < row; i++) press('ArrowDown');
    for (let i = 0; i < col; i++) press('ArrowRight');
  }
  const cellText = (rowId: string, columnId: string) =>
    grid().querySelector(`[data-cell-key="${rowId}:${columnId}"]`)?.textContent;
  const selected = () =>
    [...grid().querySelectorAll('[aria-selected="true"]')].map((c) =>
      c.getAttribute('data-cell-key'),
    );
  const paste = (text: string) =>
    act(() => {
      fireEvent.paste(active(), { clipboardData: { getData: () => text } });
    });
  const copy = () => {
    const data: Record<string, string> = {};
    act(() => {
      fireEvent.copy(active(), {
        clipboardData: {
          setData: (type: string, v: string) => (data[type] = v),
        },
      });
    });
    return data;
  };

  it('Shift+arrows select a range; the active cell keeps focus; Esc collapses', () => {
    setup();
    enterEdit();
    goTo(1, 1); // inv-2 Customer
    press('ArrowDown', { shiftKey: true });
    press('ArrowRight', { shiftKey: true });
    expect(selected()).toEqual([
      'inv-2:customer',
      'inv-2:status',
      'inv-3:customer',
      'inv-3:status',
    ]);
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:customer');
    expect(screen.getByText('2 × 2 selected')).toBeTruthy();
    press('Escape');
    expect(selected()).toEqual([]);
  });

  it('copies the range as Excel TSV (and an HTML table)', () => {
    setup();
    enterEdit();
    goTo(1, 1);
    press('ArrowDown', { shiftKey: true });
    press('ArrowRight', { shiftKey: true });
    const data = copy();
    expect(data['text/plain']).toBe('Customer 2\tPending\nCustomer 3\tPending');
    expect(data['text/html']).toContain('<td>Customer 2</td>');
  });

  it('pastes a block from Excel at the active cell, parsing each value', () => {
    setup();
    enterEdit();
    goTo(1, 1);
    paste('Acme\tdraft\r\nGlobex\tOVERDUE\r\n');
    expect(cellText('inv-2', 'customer')).toBe('Acme');
    expect(cellText('inv-2', 'status')).toBe('Draft'); // matched to the option
    expect(cellText('inv-3', 'status')).toBe('Overdue');
    expect(screen.getByText('4 changes')).toBeTruthy();
    expect(screen.getByText('Pasted 4 cells.')).toBeTruthy();
  });

  it('one value pasted onto a range fills the range', () => {
    setup();
    enterEdit();
    goTo(1, 1);
    press('ArrowDown', { shiftKey: true });
    press('ArrowDown', { shiftKey: true });
    paste('Same Co');
    expect(
      ['inv-2', 'inv-3', 'inv-4'].map((r) => cellText(r, 'customer')),
    ).toEqual(['Same Co', 'Same Co', 'Same Co']);
  });

  it('skips read-only cells and rejects values of the wrong type', () => {
    setup();
    enterEdit();
    goTo(1, 4); // inv-2 Due (read-only), then Subtotal, Tax
    paste('2026-01-01\t$1,234.50\tlots');
    expect(cellText('inv-2', 'subtotal')).toBe('1,234.50');
    expect(
      screen.getByText(
        'Pasted 1 cell · 1 skipped (read-only) · 1 rejected (wrong type).',
      ),
    ).toBeTruthy();
  });

  it('one Ctrl+Z undoes a whole paste; Ctrl+Y redoes it', () => {
    setup();
    enterEdit();
    goTo(1, 1);
    paste('A\nB\nC');
    expect(screen.getByText('3 changes')).toBeTruthy();
    press('z', { ctrlKey: true });
    expect(screen.queryByText(/changes?$/)).toBeNull();
    expect(cellText('inv-2', 'customer')).toBe('Customer 2');
    press('y', { ctrlKey: true });
    expect(screen.getByText('3 changes')).toBeTruthy();
    expect(cellText('inv-4', 'customer')).toBe('C');
  });

  it('Ctrl+D fills the top row of the range down', () => {
    setup();
    enterEdit();
    goTo(1, 2); // inv-2 Status
    typeKey('d');
    press('Enter'); // Draft, now on inv-3
    press('ArrowUp');
    press('ArrowDown', { shiftKey: true });
    press('ArrowDown', { shiftKey: true });
    press('d', { ctrlKey: true });
    expect(
      ['inv-2', 'inv-3', 'inv-4'].map((r) => cellText(r, 'status')),
    ).toEqual(['Draft', 'Draft', 'Draft']);
  });

  it('Delete clears editable cells; Backspace clears and starts editing', () => {
    setup();
    enterEdit();
    goTo(1, 1);
    press('Delete');
    // Cleared, and Customer is required, so the cell now carries its error (sr-only text).
    expect(cellText('inv-2', 'customer')).toBe('Customer is required');
    expect(active().getAttribute('aria-invalid')).toBe('true');
    press('ArrowDown');
    press('Backspace');
    const input = screen.getByRole('textbox', {
      name: 'Customer',
    }) as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('the Undo button in the Save bar works too', () => {
    setup();
    enterEdit();
    goTo(1, 1);
    typeKey('X');
    press('Enter');
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Undo' })));
    expect(cellText('inv-2', 'customer')).toBe('Customer 2');
  });
});

describe('DataGrid edit mode: validation, save results, new rows', () => {
  function goTo(row: number, col: number) {
    press('Home', { ctrlKey: true });
    for (let i = 0; i < row; i++) press('ArrowDown');
    for (let i = 0; i < col; i++) press('ArrowRight');
  }
  const cell = (rowId: string, columnId: string) =>
    grid().querySelector<HTMLElement>(`[data-cell-key="${rowId}:${columnId}"]`);
  const saveAll = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save all' }));
    });
  };
  const typeInto = (value: string) => {
    typeKey(value[0] ?? 'x');
    setEditorValue(value);
    press('Enter');
  };

  it('flags rule breaks per cell, with the message wired to the cell', () => {
    setup();
    enterEdit();
    goTo(1, 5); // inv-2 Subtotal
    typeInto('-5');
    const bad = cell('inv-2', 'subtotal');
    expect(bad?.getAttribute('aria-invalid')).toBe('true');
    const describedBy = bad?.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe(
      'Must be more than 0',
    );
    expect(screen.getByText('1 error')).toBeTruthy();
    expect(bad?.closest('tr')?.getAttribute('data-state')).toBe('error');
  });

  it('Save all is blocked by errors and jumps to the first one', async () => {
    const { onSave } = setup();
    enterEdit();
    goTo(3, 1);
    press('Delete'); // inv-4 Customer: required
    goTo(0, 0);
    await saveAll();
    expect(onSave).not.toHaveBeenCalled();
    expect(active().getAttribute('data-cell-key')).toBe('inv-4:customer');
    expect(screen.getByText('Fix 1 error before saving.')).toBeTruthy();
  });

  it('pins server validation messages to cells, and clears one when that cell is edited', async () => {
    setup({
      onSave: async () => ({
        ok: false,
        kind: 'validation',
        rows: {
          'inv-2': { fields: { customer: ['Customer is on credit hold'] } },
        },
      }),
    });
    enterEdit();
    goTo(1, 1);
    typeInto('Acme');
    await saveAll();
    expect(cell('inv-2', 'customer')?.getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:customer');
    expect(
      screen.getAllByText(/rejected by the server/).length,
    ).toBeGreaterThan(0);
    press('ArrowUp'); // focus moves to inv-1; edit inv-2 again
    press('ArrowDown');
    typeInto('Globex');
    expect(cell('inv-2', 'customer')?.hasAttribute('aria-invalid')).toBe(false);
  });

  it('conflict → Keep mine resends with the server version', async () => {
    let call = 0;
    const onSave = vi.fn(async (): Promise<SaveResult> => {
      call++;
      return call === 1
        ? {
            ok: false,
            kind: 'conflict',
            rows: [
              {
                id: 'inv-2',
                version: 9,
                current: { customer: 'Dana Co' },
                by: 'Dana',
              },
            ],
          }
        : { ok: true };
    });
    setup({ onSave });
    enterEdit();
    goTo(1, 1);
    typeInto('Mine Inc');
    await saveAll();
    expect(screen.getByText(/INV-10002 was changed by Dana/)).toBeTruthy();
    act(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Keep mine' })),
    );
    await saveAll();
    expect(onSave).toHaveBeenLastCalledWith({
      operations: [
        {
          op: 'update',
          id: 'inv-2',
          version: 9,
          changes: { customer: 'Mine Inc' },
        },
      ],
    });
  });

  it("conflict → Use theirs drops my change and shows the server's value", async () => {
    setup({
      onSave: async () => ({
        ok: false,
        kind: 'conflict',
        rows: [{ id: 'inv-2', version: 9, current: { customer: 'Dana Co' } }],
      }),
    });
    enterEdit();
    goTo(1, 1);
    typeInto('Mine Inc');
    await saveAll();
    act(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Use theirs' })),
    );
    expect(cell('inv-2', 'customer')?.textContent).toBe('Dana Co');
    expect(screen.queryByRole('button', { name: 'Save all' })).toBeNull();
  });

  it('typing in the "add a row" row creates a new row, saved as a create', async () => {
    const { onSave } = setup({
      allowAdd: true,
      newRow: () => ({ status: 'Draft' }),
    });
    enterEdit();
    press('End', { ctrlKey: true });
    press('Home');
    press('ArrowRight'); // the Customer cell of the trailing row
    expect(active().textContent).toBe('Type here to add a row…');
    typeKey('N');
    setEditorValue('New Co');
    press('Tab'); // stays on the new row, next column
    expect(active().getAttribute('data-cell-key')).toBe('tmp_1:status');
    // Subtotal is required on rows you add.
    press('ArrowRight');
    press('ArrowRight');
    press('ArrowRight');
    typeInto('250');
    await saveAll();
    expect(onSave).toHaveBeenCalledWith({
      operations: [
        {
          op: 'create',
          tempId: 'tmp_1',
          values: { status: 'Draft', customer: 'New Co', subtotal: 250 },
        },
      ],
    });
  });

  it('pasting past the last row adds rows when allowAdd is on', () => {
    setup({ allowAdd: true });
    enterEdit();
    press('End', { ctrlKey: true });
    press('ArrowUp'); // last real row (inv-30)
    press('Home');
    press('ArrowRight');
    act(() => {
      fireEvent.paste(active(), {
        clipboardData: { getData: () => 'Row A\nRow B\nRow C' },
      });
    });
    expect(cell('inv-30', 'customer')?.textContent).toBe('Row A');
    expect(cell('tmp_1', 'customer')?.textContent).toBe('Row B');
    expect(cell('tmp_2', 'customer')?.textContent).toBe('Row C');
    expect(screen.getByText('Pasted 3 cells · 2 new rows.')).toBeTruthy();
  });

  it('checkbox cells toggle with Space and Enter', () => {
    setup();
    enterEdit();
    goTo(1, 0);
    press('End');
    press('ArrowLeft'); // Emailed (inv-2: index 1 → 1 % 3 !== 0 → true)
    expect(active().getAttribute('data-cell-key')).toBe('inv-2:emailed');
    const box = () =>
      within(active()).getByRole('checkbox', {
        name: 'Emailed',
      }) as HTMLInputElement;
    expect(box().checked).toBe(true);
    press(' ');
    expect(box().checked).toBe(false);
    press('Enter');
    expect(box().checked).toBe(true);
    expect(screen.queryByText(/change/)).toBeNull(); // back to the saved value
  });

  it('empty values render empty, whatever the column renderer does', () => {
    setup();
    enterEdit();
    goTo(1, 6); // Tax (money format would show "NaN" or "0.00")
    press('Delete');
    expect(cell('inv-2', 'tax')?.textContent).toBe('');
  });
});
