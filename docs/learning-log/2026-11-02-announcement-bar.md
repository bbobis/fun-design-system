## 2026-11-02 — AnnouncementBar

- **Built:** `AnnouncementBar` (tones neutral / info / warning / danger / inverse, `action` slot, `dismissKey` remembered in localStorage, `onDismiss`, `returnFocus`) and AppShell's new `announcement` slot above the sticky top bar.
- **Remember: landmark, not live region.** A message that's on the page when it loads is a `<section aria-label="Announcement">`: screen-reader users can jump to it, and nobody gets interrupted. Live regions (`role="status"` / `alert`) are for things that **change** after load.
- **Remember: move focus when you remove the focused element.** If the × is removed while focused, focus falls to `<body>`, and screen readers often restart from the top of the page. We pick the next focusable element _before_ removing the bar, then focus it once the bar is gone.
- **Remember: storage can throw.** `localStorage` throws in some private modes, sandboxed iframes and when site data is blocked. Wrap reads and writes in try/catch; if remembering fails, the bar just comes back on the next visit.
- Docs: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
