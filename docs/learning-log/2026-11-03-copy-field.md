## 2026-11-03 — CopyField (+ shared useCopy)

- **Built:** `CopyField`, a read-only `Input` with a copy button and, with `secret`, a Show toggle. The copy logic moved into `utils/use-copy.ts` and `copy-field/copy-parts.tsx`, now shared with DescriptionList.
- **Remember: `aria-labelledby` can join several ids.** `aria-labelledby="copy-word field-label"` names the button "Copy API key" from two places: its own (hidden) word and the Field's label. When the label text changes, the button's name follows. Referenced elements count even when they're `hidden`.
- **Remember: a toggle keeps its name.** Show is `aria-pressed` with a fixed label, so a screen reader says "Show API key, toggle button, pressed". Changing the text to "Hide" _and_ the state would say the opposite of what's true.
- **Remember: `type="password"` for display-only secrets.** The browser draws the dots, and copy still copies the real value. `autoComplete="off"` keeps password managers from offering to save it.
- Docs: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-labelledby
