## 2026-11-02 — SplitPanes

- **Built:** `SplitPanes`, two panes and a handle that resizes the first one (`primary`), side by side or stacked. Keyboard (arrows, Shift, Home/End, Enter to collapse), mouse and touch, controlled or uncontrolled, works right-to-left. Hand-built on the ARIA "window splitter" pattern, because React Aria Components has no splitter.
- **Remember: the window splitter pattern.** The handle is a focusable `role="separator"` with `aria-valuenow` (the pane's %), `aria-valuemin/max`, `aria-controls` (the pane's id) and a label naming what it resizes. Its `aria-orientation` is the line's direction, so side-by-side panes have a **vertical** separator.
- **Remember: `setPointerCapture`.** After `pointerdown`, every `pointermove` goes to the handle, even when the pointer is over the other pane, an iframe, or outside the window. So the drag doesn't "drop" when you move fast. Add `touch-none` so touch drags don't scroll the page.
- **Remember: arrows follow the screen, not the code.** In a right-to-left page the primary pane is on the right, so → (handle moves right) makes it smaller. Read the real direction with `getComputedStyle(el).direction`.
- Docs: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
