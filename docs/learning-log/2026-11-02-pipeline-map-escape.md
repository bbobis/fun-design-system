## 2026-11-02 — Pipeline Map: Escape, checked instead of assumed

- **Built:** a test that pins "Escape does one thing at a time" (first Escape closes the open tooltip and keeps the selection; the second clears it), plus a line in `PipelineMap`'s JSDoc saying so. No behaviour change: the code already worked this way.
- **Remember: test a suspected bug before fixing it.** In #117 I wrote down "Escape closes the tooltip *and* clears the selection" from reasoning, not from a test. Writing the test first showed it was wrong, so the right change was a regression test and corrected docs, not new code.
- **Remember: capture phase on `document` runs before React.** While a tooltip is open, React Aria adds `document.addEventListener('keydown', …, true)` (capture) and calls `stopPropagation()` on Escape. Capture listeners on the document run before React's own listeners, so the map's `onKeyDown` never sees that Escape.
- Docs: https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
