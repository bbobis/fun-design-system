## 2026-11-03 — DataGrid column resizing + remembered layout (F2)

- **Built:** a resize handle on each header's edge (drag; double-click to fit), "Resize column" and "Fit to content" in the column menu, widths in `DataGridColumnState.widths` (48–800px), and `stateKey="invoices"` to save the layout in `localStorage` (`fds:data-grid:invoices:v1`), forgotten on Reset.
- **Remember (the prediction): not every control should be a Tab stop.** The handle is a focusable `separator` (`aria-valuenow` = width) but `tabIndex={-1}`: you reach it from the menu's "Resize column". Otherwise a 20-column grid needs 60 Tabs to cross (sort, ⌄, resize). React Aria's Table makes the same choice. ←/→ resize, Enter/Escape go back to the ⌄ button.
- **Remember: pointer capture.** `setPointerCapture(pointerId)` on pointerdown sends every move and the release to the handle, even when the mouse runs ahead of the edge. No `document` listeners to add and clean up.
- **Remember: storage is untrusted input.** `loadColumnState` checks the shape and catches errors (private mode, full quota, damaged JSON). The key carries a version, so a future incompatible shape is ignored instead of breaking the grid. The default layout isn't stored, so changing the app's default still reaches users who never customised.
- Docs: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
