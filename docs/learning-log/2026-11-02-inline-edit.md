## 2026-11-02 — InlineEdit

- **Built:** `InlineEdit`: text that turns into our `Input` on click or Enter. Enter/✓ saves, Escape/✕ cancels, focus returns to the text. Also `validate`, async `onSave` (spinner, error, text kept), `blurBehavior` save/cancel, `placeholder`, `size`, `disabled`.
- **Remember: blur fires before click.** Clicking ✕ while typing makes the input lose focus _first_. If blur saves, Cancel would save. Two guards: `onMouseDown={e => e.preventDefault()}` on ✓/✕ keeps focus in the input, so no blur happens. And the blur handler ignores focus moving to `relatedTarget` inside the editor (keyboard Tab to ✕). The first guard also covers Safari, where clicked buttons don't take focus.
- **Remember: React's `onBlur` is really `focusout`** (it bubbles). In tests, `fireEvent.blur` doesn't reach it; use `fireEvent.focusOut`. We checked that the test fails when the guard is removed.
- **Remember: give focus back only when the user ended the edit from inside** (Enter, Escape, ✓, ✕). After clicking somewhere else, focus is already where they wanted it.
- Docs: https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent/relatedTarget
