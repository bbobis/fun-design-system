## 2026-11-02 — Alert / Toast styles

- **Built:** Alert `variant="bar"` (the same look as Toast's bar), `tone="neutral"` (grey, no tone word) and `icon` (your own, or `false`). ToastRegion `placement` (top/bottom × start/center/end) and `icons`. Alert and Toast now share one icon file, `alert/status-icons.tsx`.
- **Remember: logical sides (`s`/`e`) instead of `l`/`r`.** `border-s-4` and `start-4` mean "the side where reading starts". In English that's the left; in Arabic or Hebrew (`dir="rtl"`) the browser moves them to the right for you. `left-1/2 -translate-x-1/2` stays physical on purpose: the centre is the centre in either direction.
- **Remember: newest toast nearest the edge.** React Aria lists the newest toast first. At the top, `flex-col` puts it at the top. At the bottom, `flex-col-reverse` puts it at the bottom. Either way, new toasts appear by the screen edge and older ones move inward.
- **Remember: style the wrapper, not the child you don't own.** The icon colour is on a `<span>` around the icon, so a custom `icon` gets the tone colour through `currentColor`.
- Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values
