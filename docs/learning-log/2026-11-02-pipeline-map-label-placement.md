## 2026-11-02 — Pipeline Map follow-up: facility `labelPlacement`

- **Built:** `Facility.labelPlacement` (`'below' | 'above' | 'left' | 'right'`, default `'below'`), so a data author can move a facility's name off a pipe. `labelLayout()` returns where the text and tank gauge go for each side. `mapPadding()` widens only the map edge that a label points out of, so other maps don't shrink. The demo now puts Station B and Station C's names above, because their branches leave downward.
- **Remember: `text-anchor` decides which end of the text sits on `x`.** `start` grows right from `x`, `end` grows left, and `middle` centres on it. "Left of the marker" is `x = -18` plus `anchor: 'end'`, so the name ends just before the marker however long it is. You don't need to measure the text.
- **Remember: put the layout in a pure function, then test that function.** `labelLayout('left')` returns plain numbers, so the spec checks it without a DOM, and the component just reads the result. It's the same idea as `nextInDirection` for the keyboard.
- **Remember: left and right are screen sides, not reading-direction sides.** SVG text doesn't flip in a right-to-left page, so `'left'` means the left of the screen there too. That's why it isn't called `start`/`end`.
- Docs: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/text-anchor
