# 0001 — React Aria Components is our headless library

- **Status:** Accepted
- **Date:** 2026-10-04
- **Decided by:** Ben
- **Research:** `claude/research/downshift-vs-react-aria-vs-base-ui.md` and
  `claude/research/downshift-select-and-combobox.md` (project docs)

## Context

The design system needs accessible interactive components that are hard to build by
hand: Select, Combobox (single and multi), and soon a date picker and a date cell editor
for the DataGrid, plus Dialog, Menu, Popover, Tooltip and Tabs. We want one headless
library so focus, keyboard, dismiss and positioning behave the same everywhere.

## Decision

Use **React Aria Components** (`react-aria-components`, Adobe, Apache-2.0) as the headless
foundation. Drop to the lower-level `react-aria` / `react-stately` hooks only when a
component needs more control than the components give.

Our public components wrap it: apps import `@fun-design-system/ui`, never
`react-aria-components` directly. That keeps the door open to change internals later.

## Options considered

| Option | Why not |
|---|---|
| **A. React Aria everywhere** | Chosen. The only option that covers every component on the roadmap, including DatePicker / DateField / Calendar. |
| B. Base UI + React Aria only for dates | Easiest to learn (Radix/shadcn anatomy), but two libraries with different focus, dismiss and positioning models that would meet exactly where it's hardest: date popovers inside dialogs and grid cells. Revisit only if we outgrow React Aria. |
| C. Downshift + Base UI + a date library | Smallest bundle, but three libraries, the most code to own, and Downshift is maintained mostly by one person. |

## Consequences

- **Bundle:** about 66 KB gzip for Select + ComboBox (in-house esbuild measurement), more
  with TagGroup and Virtualizer. Accepted for an enterprise app; measure again per component.
- **Learning curve:** collections, slots and render props are new concepts. Each first use
  gets a short explanation and a learning-log entry.
- **Keyboard events stop at the component by default.** React Aria doesn't let keys
  bubble unless a handler calls `continuePropagation()`. The DataGrid's popover cell
  editors therefore go through one adapter that handles Enter / Tab / Escape in the
  capture phase, plus a `getValue()` / `requestCommit()` editor contract.
- **Dates:** React Aria uses `@internationalized/date` objects (`CalendarDate`), not JS
  `Date`. The date editor converts at the boundary.
- **Field:** our `Field` gains a `labelId`, so React Aria triggers can be named by our own
  label (`aria-labelledby`).
- **Styling:** React Aria sets its own inline positioning styles on popovers; our code
  stays Tailwind-only and sizes with its CSS variables (e.g. `w-(--trigger-width)`).
  The exact wording of the styling rule for library-set styles is still to be confirmed.
- **Dependencies:** `react-aria-components` is added with the first component that uses
  it (Select). Its own dependencies come with it; any *other* new dependency still needs
  Ben's approval.
