## 2026-11-02 — Bento: tile surfaces, a featured (inverse) tile, tiled frame

- **Built:** `BentoTile` gets `surface` (`none` / `card` / `muted` / `inverse`) and `padding`, so a tile no longer needs a Card inside. `Bento` gets `variant="tiled"`: one rounded frame with thin lines between tiles. Defaults are unchanged.
- **Remember (the prediction): don't paint the frame. Let each tile draw its own line.**
  - The common hairline trick is a frame filled with the border color and a 1px gap between white tiles. Wherever the last row isn't full, that leaves a **gray block**.
  - Here each tile draws a 1px ring (`shadow-[0_0_0_1px_var(--color-border)]`) into the 1px gap and the 1px frame padding. Lines appear only around real tiles, and empty spots stay the page color. The Tiled story uses 5 tiles in 4 columns to show it.
- **Remember: the featured tile uses `data-inverse` (recipe rule 14), not new colors.** It takes the opposite theme's tokens, so `bg-bg text-fg` turns dark on a light page and light on a dark one. The Button inside re-themes itself with no extra code.
- **Remember: the container decides what children drop.** A tile inside a tiled Bento reads that from context and removes its own radius and border, because the frame owns them. This is the same "who draws the border" rule as Accordion.
- Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow
