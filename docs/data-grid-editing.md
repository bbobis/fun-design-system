# DataGrid editing guide

How to turn on spreadsheet-style editing in `DataGrid`, and how to connect it to **any**
backend. The grid owns the draft (unsaved edits); your app owns the network.

## TL;DR

```tsx
<DataGrid
  aria-label="Invoices"
  data={rows}                                // update this after a successful save
  columns={columns}                          // editable columns have meta.editor
  getRowId={(r) => r.id}
  editing={{
    onSave: async (changes) => mapToSaveResult(await api.saveBatch(changes)),
    getRowVersion: (r) => r.version,         // optional: optimistic locking
    isRowLocked: (r) => r.status === 'Paid', // optional
    allowAdd: true,                          // optional: "Type here to add a row…"
    newRow: () => ({ status: 'Draft' }),     // optional: defaults for new rows
  }}
/>
```

Nothing is sent until the user clicks **Save all**. A failed save never loses work.

## 1. Make columns editable

Editable columns must be accessor columns (`col.accessor('field')`): the grid writes the
value back to that field.

```ts
col.accessor('customer', { header: 'Customer', meta: { editor: 'text', required: true } }),
col.accessor('status', { header: 'Status', meta: { editor: 'select', options: ['Draft', 'Paid'] } }),
col.accessor('subtotal', {
  header: 'Subtotal',
  meta: {
    editor: 'number',
    validate: (v) => (typeof v === 'number' && v <= 0 ? 'Must be more than 0' : undefined),
  },
}),
col.accessor('emailed', { header: 'Emailed', meta: { editor: 'checkbox' } }),
```

| `meta.editor` | Accepts (typed or pasted) |
|---|---|
| `text` | anything |
| `number` | `1500`, `1,500.50`, `$1,500.50` (empty = `null`) |
| `select` | one of `options`, any case (`pending` → `Pending`) |
| `checkbox` | Space / Enter / click toggles; paste `TRUE`, `yes`, `1`, `x` / `FALSE`, `no`, `0` |

Date and searchable-select editors come later (they need a popover component).

**Validation.** `required` and `validate(value, row)` run on every row the user edited or
added. `row` includes draft values, so cross-field rules work
(`(v, row) => v < row.issued ? 'Before the issue date' : undefined`). Save is blocked
while there are errors; clicking it jumps to the first one.

## 2. The contract: what `onSave` gets and returns

The only types your backend code needs (all exported from `@fun-design-system/ui`):

```ts
type ChangeSet = {
  operations: Array<
    | { op: 'update'; id: string; version?: number | string; changes: Record<string, unknown> }
    | { op: 'create'; tempId: string; values: Record<string, unknown> }
  >;
};

type SaveResult =
  | { ok: true; created?: Array<{ tempId: string; id: string; version?: number | string }> }
  | { ok: false; kind: 'validation'; rows: Record<string, { fields?: Record<string, string[]>; row?: string[] }> }
  | { ok: false; kind: 'conflict'; rows: Array<{ id: string; version: number | string; current: Record<string, unknown>; by?: string; at?: string }> };
```

- `update` carries **only the changed fields**, plus the version the user started from.
- `create` carries a temporary id (`tmp_1`) and the new row's values (defaults included).
- In `validation`, `rows` is keyed by row id **or temp id**. Field messages pin to cells;
  `row` messages pin to the row.
- Resolving to nothing (`void`) counts as success. Throwing means "couldn't reach the
  server": the draft is kept and the bar says so.

**After a successful save, give the grid fresh `data`** (refetch, or merge the response).
New rows with real ids appear at the bottom until the user clicks Done.

## 3. Mapping a backend to `SaveResult`

The grid doesn't know about HTTP. Map your API's responses in `onSave`. A typical batch
endpoint (any language) answers 200, 422 or 409:

```ts
onSave: async (changes) => {
  const res = await fetch('/api/invoices/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(changes),
  });
  if (res.ok) return { ok: true, created: (await res.json()).created };
  if (res.status === 422) return { ok: false, kind: 'validation', rows: (await res.json()).rows };
  if (res.status === 409) return { ok: false, kind: 'conflict', rows: (await res.json()).rows };
  throw new Error(`Save failed: ${res.status}`); // the grid keeps the draft
},
```

If your API has no batch endpoint, `onSave` can send one request per operation and
combine the results. If it isn't atomic, consider returning `validation` for the rows
that failed and reloading `data` for the ones that succeeded.

**Optimistic locking.** Send `version` back to the server and have it compare the
version *in the request* with the stored one. (In JPA, loading the entity and copying
fields onto it checks the freshly loaded version, not the client's: compare explicitly.)

## 4. Conflicts: Use theirs / Keep mine

When `onSave` returns `kind: 'conflict'`, the Save bar shows one row at a time:

- **Use theirs:** drops the user's changes to that row and shows `current`.
- **Keep mine:** keeps the changes. The grid now sends the **server's** `version` for that
  row, so the next Save all overwrites instead of conflicting again.

Both choices adopt the new version. They last until the app passes new `data`.

## 5. Keyboard and mouse

| Keys | Navigation (on a cell) | Editing (in the cell's input) |
|---|---|---|
| Arrows, Home/End, PgUp/PgDn | Move (Ctrl+arrow / Ctrl+Home/End: to the edge) | Caret |
| Shift + those | Extend the range | Select text |
| Enter / F2 | Edit, keeping the value | Commit, move down (Shift: up) |
| A letter or digit | Edit, replacing the value | Type |
| Tab / Shift+Tab | Move right / left; leaves the grid at the row's edge | Commit, move right / left |
| Esc | Collapse the range | Cancel the edit |
| Delete / Backspace | Clear the range / clear and edit | Delete text |
| Ctrl+C / X / V | Copy / cut / paste the range (Excel TSV) | The input's own |
| Ctrl+D | Fill down | — |
| Ctrl+Z / Ctrl+Y | Undo / redo the last gesture | The input's own undo |
| Ctrl+A | Select all | Select text |

Mouse: click selects, drag or Shift+click selects a range, double-click edits, clicking
elsewhere commits.

**Deviation from the WAI-ARIA grid pattern:** strictly, a grid is one Tab stop. Excel
users expect Tab to move between cells, so Tab moves within the row and leaves the grid
only at the row's first/last cell. There's never a keyboard trap.

## 6. What the grid guarantees

- Sorting and search are frozen while editing, so rows never jump under the cursor.
- Locked rows and non-editable columns are skipped by paste, fill and clear.
- One gesture (a 200-cell paste) is one undo step.
- `beforeunload` warns about unsaved changes, and only while there are some.
- Every message ("Saved 3 changes", "Customer is required") is shown in the footer and
  announced to screen readers.
