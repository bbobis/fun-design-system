## 2026-11-03 — Lint back to 0 warnings

- **Built:** cleared the 4 warnings that came in with the Pipeline Map and Slider work. Three intentional `useEffect` dependency lists got a scoped `eslint-disable-next-line` with the reason; Slider's `<>{children}</>` became `return children;`.
- **Remember: `exhaustive-deps` is a guess, not a rule.** It assumes "re-run whenever anything you read changes". For announcements that's wrong: a data refresh would repeat "Trace: …" to screen-reader users. Keep the narrow list on purpose, write why next to it, and silence the rule for that one line only.
- **Remember: a component can return any `ReactNode`.** A string, an array or `children` itself all work, so a Fragment around a single child adds nothing.
- Docs: https://react.dev/reference/react/useEffect#removing-unnecessary-object-dependencies
