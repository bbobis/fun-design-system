## 2026-11-02 — DataGrid: comfortable density, stripes, cell lines, pinned first column

- **Built:** DataGrid gets `density="comfortable"` (48px), `striped`, `gridLines="all"` and `pinFirstColumn` (the checkbox column plus the first data column stay put while the rest scrolls sideways, with an edge line). Defaults are unchanged.
- **Remember (the prediction): sticky things need scroll padding.** A pinned column covers the left edge of the scroll box, so `scrollIntoView` could "reveal" a cell right under it. `scroll-padding-inline-start` (`scroll-ps-(--pin-w)`) tells the browser that strip is taken, the same way `scroll-pt-9` already handles the sticky header row. Checked in Chromium: the revealed cell starts exactly at the pinned edge (205px = 205px).
- **Remember: pinned cells need solid colors.** Things scroll *under* them, so see-through fills (`bg-primary/10`, `bg-surface/60`) would show text through. Each state gets an opaque mix with the page color instead: `bg-[color-mix(in_oklab,var(--color-primary)_10%,var(--color-bg))]`. It looks the same and hides what's underneath.
- **Remember: in a virtual list, stripe by index, not `:nth-child`.** Only the rows on screen are in the DOM, so CSS parity would flip as you scroll. The row's data index doesn't change.
- Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding-inline-start
