import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { DataGrid } from './data-grid';
import type {
  ChangeSet,
  DataGridEditing,
  SaveResult,
} from './editing/contract';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

// jsdom has no layout: a viewport tall enough for every row (see data-grid.editing.spec).
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
});
afterAll(() => vi.restoreAllMocks());

type Row = Invoice & { version: number };
// Row 0 is Paid (locked when isRowLocked is set); the rest are Pending.
const rows: Row[] = makeInvoices(8).map((r, i) => ({
  ...r,
  status: i === 0 ? 'Paid' : 'Pending',
  version: 10 + i,
}));

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
        getRowId={(r) => r.id}
        editing={{
          allowDelete: true,
          getRowVersion: (r) => (r as Row).version,
          onSave: async (changes) => {
            const result = await onSave(changes);
            // Like a real app: drop the deleted rows from the data after a save.
            const gone = new Set(
              changes.operations.flatMap((o) =>
                o.op === 'delete' ? [o.id] : [],
              ),
            );
            setData((prev) => prev.filter((r) => !gone.has(r.id)));
            return result;
          },
          ...editing,
        }}
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
/** The row (tr) of a data row, found by its first cell. */
const rowOf = (id: string) =>
  document.querySelector(`[data-cell-key="${id}:number"]`)?.closest('tr');
const status = () => screen.getByRole('status').textContent ?? '';

/** Selects rows 1–2 (the first cell starts on row 0): ↓, then Shift+↓. */
function selectRows1to2() {
  press('ArrowDown');
  press('ArrowDown', { shiftKey: true });
}

describe('DataGrid deleting rows', () => {
  it('no Delete button unless allowDelete, and only while editing', () => {
    setup({ allowDelete: false });
    expect(screen.queryByRole('button', { name: /Delete/ })).toBeNull();
  });

  it('marks the selected rows deleted: struck through, said, counted; Save sends delete ops', async () => {
    const { onSave } = setup();
    selectRows1to2();
    fireEvent.click(screen.getByRole('button', { name: 'Delete 2 rows' }));

    for (const r of [rows[1], rows[2]])
      expect(rowOf(r.id)?.getAttribute('data-state')).toBe('deleted');
    // Screen readers hear it in the row's first cell.
    expect(rowOf(rows[1].id)?.textContent).toContain('Deleted, ');
    expect(status()).toContain('2 to delete');
    // Focus goes back to the grid, not left on the button.
    expect(document.activeElement?.getAttribute('data-cell-key')).toBe(
      `${rows[1].id}:number`,
    );

    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await act(() => Promise.resolve());
    expect(onSave).toHaveBeenCalledWith({
      operations: [
        { op: 'delete', id: rows[1].id, version: 11 },
        { op: 'delete', id: rows[2].id, version: 12 },
      ],
    });
    expect(rowOf(rows[1].id)).toBeFalsy();
  });

  it('Ctrl+Z restores them (a delete is one history entry)', () => {
    setup();
    selectRows1to2();
    fireEvent.click(screen.getByRole('button', { name: 'Delete 2 rows' }));
    press('z', { ctrlKey: true });
    expect(rowOf(rows[1].id)?.getAttribute('data-state')).toBeNull();
    expect(rowOf(rows[2].id)?.getAttribute('data-state')).toBeNull();
  });

  it('when every selected row is deleted, the button restores them', () => {
    setup();
    selectRows1to2();
    fireEvent.click(screen.getByRole('button', { name: 'Delete 2 rows' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restore 2 rows' }));
    expect(rowOf(rows[1].id)?.getAttribute('data-state')).toBeNull();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });

  it('a deleted row can’t be edited until it is restored', () => {
    setup();
    press('ArrowDown');
    fireEvent.click(screen.getByRole('button', { name: 'Delete 1 row' }));
    press('ArrowRight'); // Customer: an editable column
    press('Enter');
    expect(document.activeElement?.tagName).not.toBe('INPUT');
    expect(screen.getByText(/This row will be deleted/)).toBeTruthy();
  });

  it('locked rows are skipped, and the user is told', () => {
    setup({ isRowLocked: (r) => r.status === 'Paid' });
    press('ArrowDown', { shiftKey: true }); // rows 0 (locked) and 1
    // The label counts only the rows it will delete.
    fireEvent.click(screen.getByRole('button', { name: 'Delete 1 row' }));
    expect(rowOf(rows[0].id)?.getAttribute('data-state')).toBeNull();
    expect(rowOf(rows[1].id)?.getAttribute('data-state')).toBe('deleted');
    expect(screen.getByText(/1 locked row skipped/)).toBeTruthy();
  });
});
