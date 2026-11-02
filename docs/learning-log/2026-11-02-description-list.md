## 2026-11-02 — DescriptionList

- **Built:** `DescriptionList` + `DescriptionItem` for detail pages: `layout` horizontal / vertical / grid, `divided`, `size`, `span="full"` (grid), empty values as "—" (read "None"), and `copy` buttons with a "Copied" announcement.
- **Remember: `<dl>` → `<div>` → `<dt>` + `<dd>`.** HTML allows one `<div>` around each pair inside a `<dl>`. That's what lets us style a pair as a row without breaking the list's meaning.
- **Remember: container queries (`@container` + `@md:`).** The list goes side by side when its **box** is at least 28rem wide, not the window. So the same component stacks in a 26rem Drawer and lines up on a full page.
- **Remember: clipboard can fail.** `navigator.clipboard` exists only on https (and localhost), can be blocked by permissions or an iframe, and `writeText` returns a Promise that can reject. So "Couldn't copy" is a real state: a red icon plus a polite `role="status"` message. The status element is always in the DOM, so screen readers notice when its text changes.
- Docs: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
