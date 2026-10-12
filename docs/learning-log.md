# Learning log

Short notes after each task: what was built, what to remember, one link to read.

## 2026-10-03 — Brand, contrast and fonts

- **Built:** a root `package.json` (`"private": true`, version `0.0.0`) and installed the fonts, `@fontsource-variable/ibm-plex-sans` and `@fontsource/ibm-plex-mono`. No Nx yet; `nx init` will add to this file.
- **Remember — contrast:** normal text needs **4.5:1** against its background (WCAG AA). Primary `yellow-500` + white = 1.7:1 ✗, + `gray-900` = 10.8:1 ✓. So yellow is a *background* color, never text on white. Warning moved to clementine so it never looks like a primary button.
- **Remember — web fonts:** you can't install a font on users' machines. The font files ship with the code. A **variable** font holds every weight in one file, and its CSS name gets "Variable" added: `font-family: "IBM Plex Sans Variable"`. Plex Mono has no variable version, so import each weight (`@fontsource/ibm-plex-mono/400.css`).
- **Remember — tables:** use `tabular-nums` so every digit has the same width and number columns line up.
- **Read:** https://fontsource.org/docs/getting-started/variable

## 2026-10-03 — Phase 1: Skeleton

- **Built:** Nx 23 workspace (`ts` preset, npm workspaces) with one library, `packages/ui` (`@fun-design-system/ui`). Vite 8 build, Vitest, ESLint, Prettier, Storybook 10, Tailwind v4, and Plex fonts in `src/styles/`. All of lint, typecheck, test, build and build-storybook pass.
- **Remember: Nx basics.** A workspace holds *projects*; each project has *targets* (build, test, lint…). Run one with `npx nx <target> <project>` (e.g. `npx nx test ui`), several with `npx nx run-many -t lint test`. Nx *infers* most targets from config files (`vite.config.mts` gives `build`/`test`, `.storybook/` gives `storybook`). See them all: `npx nx show project ui`.
- **Remember: npm workspaces.** `packages/ui` has its own `package.json`, so its dependencies (the fonts) live there, not at the root. Root holds shared dev tools. Install into one package with `npm i <pkg> -w packages/ui`.
- **Remember: CSS layers.** Tailwind v4 puts utilities in `@layer utilities`, and any CSS *outside* a layer beats layered CSS. That's why Storybook's docs styles overrode our fonts until the content was wrapped in `<Unstyled>`.
- **Read:** https://nx.dev/features/run-tasks

## 2026-10-03 — Cleanup: Babel removed, editor extensions

- **Removed:** `packages/ui/.babelrc` and the `@babel/core` / `@babel/preset-react` dev dependencies. The Nx generator adds them by default, but nothing used them; all checks pass without them.
- **Remember: Vite 8 doesn't use Babel.** `@vitejs/plugin-react` v6 compiles JSX with **Oxc** (Rust, built into Vite 8's Rolldown). Vitest and Storybook reuse `vite.config.mts`, so they don't need Babel either. Generator output is a starting point: ask "who reads this file?"
- **Remember: `nrwl.angular-console` is Nx Console.** The extension ID is a leftover from when Nx was Angular-only; it works for any Nx workspace. Also recommended now: Tailwind IntelliSense (`bradlc.vscode-tailwindcss`) and Vitest (`vitest.explorer`).
- **Read:** https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react

## 2026-10-03 — Phase 2: Tokens

- **Built:** `packages/ui/src/styles/tokens.css` (brand primitives, light/dark theme values, semantic tokens), a Storybook **Foundations / Tokens** page that reads every value from the compiled CSS and computes WCAG contrast live, a light/dark toolbar toggle (`@storybook/addon-themes`), and `src/utils/contrast.ts` with the library's first unit tests (8).
- **Remember: three token layers.** Primitive (`--color-yellow-500: #ffb81c`) → theme value (`--fds-primary: var(--color-yellow-500)`, overridden under `[data-theme='dark']`) → semantic (`--color-primary: var(--fds-primary)` in `@theme inline`). Components use only the semantic layer: `bg-primary text-on-primary`. Dark mode changes the variables underneath, never the component.
- **Remember: `@theme inline` vs plain `@theme`.** Plain `@theme` bakes the value into `--color-primary` once. `inline` makes `bg-primary` compile to `var(--fds-primary)`, which is what lets a theme swap it. `static` emits every variable even if unused, so the Tokens page can read them.
- **Remember: Tailwind only generates classes it can see as literal strings.** `` `bg-${name}` `` produces nothing. The Tokens page lists class names in full, and the 60 primitive swatches come from `@source inline("bg-{yellow,…}-{50,{100..900..100}}")` in the Storybook-only `preview.css`, so apps don't ship them.
- **Decided while building:** `border` (gray-100) is decorative; inputs use the new `border-strong` (gray-400, 4.4:1). Light-mode `link-underline` is `yellow-700`, since `yellow-500` on white is 1.7:1 and invisible. Yellow primary stays yellow in dark mode on purpose.
- **Read:** https://tailwindcss.com/docs/colors#referencing-other-variables

## 2026-10-03 — Phase 3, task 1: Button

- **Built:** `Button` (4 intents × 3 sizes, `disabled`, `loading`), 8 tests, 5 stories, `cn()` helper, `docs/component-recipe.md`. Dependencies added with Ben's OK: `class-variance-authority` (variants) and `tailwind-merge` (className overrides).
- **Remember: `cva` derives the props type from the config.** `VariantProps<typeof buttonVariants>` gives `intent?: 'primary' | 'secondary' | …`. Add a variant in one place and the type follows.
- **Remember: `type="button"` by default.** A native `<button>` inside a `<form>` defaults to `type="submit"`, so a plain "Cancel" button would submit the form. The test *"defaults to type=button, so it does not submit"* locks this in.
- **Remember: `disabled` vs `aria-disabled`.** Native `disabled` removes the button from the tab order, so a keyboard user loses their place when a click turns into "loading". While loading we use `aria-disabled` + `aria-busy` and ignore clicks instead; focus stays put.
- **Gotcha: `outline-none` breaks `focus-visible:outline-*` in Tailwind v4.** It sets `--tw-outline-style: none` on the element, and the focus rule reads that variable. Leave `outline-none` off; the browser's default outline only shows on keyboard focus anyway.
- **Read:** https://cva.style/docs/getting-started/variants

## 2026-10-03 — Phase 3, task 3: Input, Label, Field

- **Built:** `Label` (native `<label>`, aria-hidden required marker), `Input` (native `<input>`, sizes matching Button, `invalid` → `aria-invalid`), and the first composite, `Field` (label + control + description + error, wired through React context). New token `fg-danger` for error text: `cherry-500` is only 3.2:1 on the dark background, so dark mode uses `cherry-300`. 12 new tests (28 total).
- **Remember: how a screen-reader user hears an error.** `aria-describedby` on the input lists the ids of the help text and the error. On focus, the reader says the label, then those texts. `aria-invalid="true"` adds "invalid entry". No error = attribute removed, not `"false"`.
- **Remember: `useId()` for ids.** Every Field gets unique, SSR-safe ids, so two Fields on one page never collide. Never hardcode an id inside a reusable component.
- **Remember: query by accessible name in tests.** `getByRole('textbox', { name: 'Full name' })` computes the name like a screen reader (skipping `aria-hidden`). `getByLabelText` matched the raw text `"Full name*"` and failed.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby

## 2026-10-03 — Phase 3, task 4: Text, Heading, Badge, Card

- **Built:** `Text` (polymorphic `as`, size/tone/weight, `numeric` for tabular digits), `Heading` (required `level`, independent `size`), `Badge` (soft status tones), `Card` (polymorphic `as`, outline/filled, padding), and an *Examples / Invoice summary* story that uses all four. 14 new tests (42 total).
- **Remember: polymorphic components with generics.** `TextProps<T extends 'p' | 'span' | …>` = `{ as?: T } & Omit<ComponentProps<T>, 'as'>`, so the props follow the tag. Inside the function, `(as ?? 'p') as ElementType` is the one deliberate escape hatch; a `@ts-expect-error` test proves callers are still type-checked (`htmlFor` on a `<p>` fails).
- **Remember: heading level is structure, not size.** Screen-reader users jump between headings by level. A big title under an existing `<h1>` is still an `<h2>`; set `size="2xl"` for the look. That's why `level` is required and `size` is optional.
- **Remember: Badge text carries the meaning.** Color only reinforces "Paid" / "Overdue"; some users can't tell the tones apart. Badges aren't interactive; clickable things are Buttons.
- **Read:** https://www.w3.org/WAI/tutorials/page-structure/headings/

## 2026-10-03 — DataGrid (TanStack Table v9 + Virtual)

- **Built:** `DataGrid<TData>`: client-side grid for large data (10,000 × 20 measured), sorting, global search, row selection with select-all and Shift-range, sticky header, compact/standard density. `createDataGridColumnHelper<TData>()` for typed columns with `meta: { align, mono }`. 11 tests (53 total). Deps added with Ben's OK: `@tanstack/react-table` **9.2.4 (pinned exact)**, `@tanstack/react-virtual` ^3.14.13.
- **Remember: virtualization = render only what's visible.** 10k rows × 20 columns would be 200,000 cells. The grid keeps ~25–34 rows (≈525 cells) in the DOM and positions them with `translateY`. Fixed row heights mean no measuring, which is the biggest single performance win.
- **Remember: TanStack Table v9 ≠ v8 tutorials.** `useTable({ features, columns, data })`, features registered explicitly with `tableFeatures({...})`, `table.FlexRender`, generics `ColumnDef<TFeatures, TData, TValue>`. Most blog posts and AI snippets are v8 and won't compile.
- **Remember: `memo` per row + `useDeferredValue` for search.** Rows that stay on screen keep the same props, so React skips them while scrolling. Search text updates instantly; the 10k-row filter uses the deferred value, so typing never waits.
- **Gotcha:** TanStack sorts number/date columns *descending* on the first click by default. We set `sortDescFirst: false` so every column starts ascending, like Excel.
- **Read:** https://tanstack.com/table/latest/docs/framework/react/guide/virtualization

## 2026-10-03 — Edit-mode prototype (plain HTML, before the React build)
- **Built:** a clickable prototype of "Edit table → draft → Save all" to test the feel with real users before writing React. It is the spec for the editing phases.
- **Remember: roving tabindex + re-render.** Only the active cell has `tabindex="0"`. If you re-render and throw away the focused element, focus falls to `<body>` and the keyboard goes dead. Fix: note `grid.contains(document.activeElement)` before the re-render and focus the new active cell after. In React, keys keep the DOM node alive, but a virtualized row scrolling out has the same problem (that's why `rangeExtractor` keeps the focused row mounted).
- **Remember: the draft is a separate layer.** Server rows never change while editing; edits live in a `Map` keyed `rowId:colId`. Save sends only the diff plus each row's `version`, so Spring can answer 409 for a row someone else changed.
- **Gotcha:** CSS specificity. `.bar .btn:hover:not(:disabled)` (4 selectors) beat `.bar .btn.primary` (3), so the yellow button went dark on hover. In Tailwind this goes away because each state is its own class (`hover:bg-primary-hover`).
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/grid/

## 2026-10-04 — PR A: DataGrid restyle (style A + bulk bar) and the Checkbox primitive
- **Built:** a calm card layout for DataGrid (title, count chip, search with icon, actions slot, quiet sort icons, selected-row wash + rail, footer status), a style C bulk-action bar, and a new `Checkbox` primitive.
- **Remember: scoped theming.** `data-inverse` re-declares the `--fds-*` variables on one element. Because our semantic tokens are `@theme inline`, `bg-secondary` resolves `var(--fds-secondary)` *at the element*, so everything inside flips, Button included, with zero component changes.
- **Remember: `peer` and `group`.** `peer-checked:opacity-100` styles a sibling from the input's state (the tick); `group-hover:opacity-50` styles a child from the parent's hover (the sort icon). CSS does the state tracking, not React.
- **Gotcha:** fading only the input (`disabled:opacity-50`) left the tick invisible in dark mode. Fade the wrapper instead: `has-[:disabled]:opacity-50`.
- **Read:** https://tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-sibling-state

## 2026-10-04 — PR B: DataGrid edit mode, draft and Save bar
- **Built:** `editing={{ onSave, getRowVersion, isRowLocked }}` on DataGrid: Edit toggle, ARIA grid mode with roving tabindex (TanStack `cellSelectionFeature`), Excel keys (arrows, Home/End, PgUp/PgDn, Tab, Enter/F2, type-to-replace, Esc), text/number/select editors, an immutable draft applied over the data, a Save bar with two-step Discard, `beforeunload` while dirty. Backend contract = types only (`ChangeSet`, `SaveResult`).
- **Remember: focusing something that isn't rendered yet.** With virtualization, PgDn can target a row that isn't in the DOM, and `.focus()` on nothing does nothing. We store a *pending focus* key, scroll the row into range, and a layout effect focuses the cell on the first render that contains it.
- **Remember: keep logic pure, keep React thin.** `getGridKeyAction(event, state)` is a plain function (one-line tests per key); `draft.ts` is plain functions over immutable objects. The component only wires them up.
- **Gotcha:** jsdom has no `CSS.escape` or `scrollIntoView`; guard or avoid them, or every test crashes in a layout effect.
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/grid/#keyboardinteraction-settingfocusandnavigatinginsidecells

## 2026-10-04 — PR C: DataGrid Excel feel (ranges, clipboard, fill, undo)
- **Built:** range selection (Shift+keys, Shift+click, mouse drag via TanStack's selection handlers, Ctrl+A), copy/cut/paste as Excel TSV (+ HTML table), paste tiling and per-column parsing ("pending" → "Pending", "$1,234.50" → 1234.5), read-only skip, Ctrl+D, Delete, Backspace, Ctrl+Z / Ctrl+Y and an Undo button.
- **Remember: the command pattern for undo.** One user gesture = one history entry holding `{ rowId, columnId, before, after }` for every cell it touched. A 200-cell paste is one entry, so one Ctrl+Z undoes it. Undo replays `before`, redo replays `after`; a new gesture drops the redo trail.
- **Remember: clipboard events, not the Clipboard API.** `copy` / `cut` / `paste` events are synchronous, need no permission prompt and work in every browser; `navigator.clipboard` is async and Firefox/Safari prompt for reads.
- **Gotcha:** a generic `Cell<F, TData>` doesn't assign to `Cell<F, any>` in every position. When a function only needs a few members, type it structurally (`{ row: { id: string }; … }`).
- **Read:** https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event

## 2026-10-04 — Fix: typecheck/build race on packages/ui/dist
- **Fixed:** `tsc --build` (typecheck) and `vite build` both used `packages/ui/dist`. Nx runs independent targets in parallel, and vite empties `dist/` first, so after a source change typecheck could lose its own `.d.ts` files mid-run (TS6305). `tsconfig.lib.json` now writes typecheck output to `out-tsc/lib`; `dist/` belongs to `vite build` only.
- **Remember: one output folder per task.** In Nx, two targets with no `dependsOn` between them can run at the same time. If they write the same folder, you get flaky failures that pass when each runs alone.
- **Remember: fix the cause, not the order.** `dependsOn: ["build"]` on typecheck would also have "fixed" it, by making every typecheck wait for a full build. Separate folders keep both fast and independent.
- **Read:** https://nx.dev/docs/concepts/task-pipeline-configuration

## 2026-10-04 — PR D: validation, save results, new rows, checkbox
- **Built:** `required` / `validate` column rules with error cells (ring, corner flag, `aria-invalid` + `aria-describedby`), a red row rail, "N errors · Go to error", Save blocked by errors; server `validation` messages pinned to cells (cleared when edited); `conflict` → Use theirs / Keep mine; new rows ("Type here to add a row…", paste past the bottom) sent as `create`; checkbox editor; empty values render empty; `docs/data-grid-editing.md`. Also split `data-grid.tsx` into row / utils / icons.
- **Remember: why "Keep mine" changes the version.** The server rejected the save because the user's `version` was stale. Keeping your values but re-sending the old version would just conflict again, so both choices adopt the server's version; "mine" then overwrites on purpose.
- **Remember: don't disable a button you can explain.** Save stays clickable with errors and jumps to the first one. A disabled button gives no reason and can't be focused.
- **Gotcha:** jsdom can't scroll, so virtualized rows below the fake viewport never mount. Make the test viewport tall enough for the rows the test touches.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid

## 2026-10-04 — Decision: React Aria Components as the headless library
- **Decided:** React Aria Components (Adobe) over Base UI and Downshift, recorded in `docs/decisions/0001-headless-library.md`. Deciding factor: it's the only one with a date picker, so the design system stays on one library.
- **Remember: an ADR (architecture decision record)** is a short file: context, decision, options rejected, consequences. Future teammates read it instead of re-opening the debate.
- **Remember: React Aria stops key events from bubbling by default.** A parent (like our grid's `<table>`) won't see Enter unless the handler calls `e.continuePropagation()`, or the parent listens in the capture phase.
- **Read:** https://react-aria.adobe.com/

## 2026-10-04 — Select: the first React Aria component
- **Built:** `Select` on React Aria Components (`Select` → `Button` + `SelectValue` + `Popover` + `ListBox`), with our own API (`options`, `value`, `onChange`, `size`, `invalid`), a hidden `<select>` for plain form posts, and `Field` now gives its label an id (`labelId`) so the trigger is named with `aria-labelledby`.
- **Remember: focus restore.** When a popup closes, focus goes back to whatever had it before it opened (the trigger). React Aria's `FocusScope` does this for you, one animation frame after the popup unmounts. Hand-rolled popups often forget this, and keyboard users end up on `<body>`.
- **Remember: wrap, don't re-export.** Apps import our `Select`, never `react-aria-components`. Our props stay simple (`string | null`), and we can change the internals later without breaking apps.
- **Gotcha:** jsdom lacks `CSS.escape`; React Aria needs it. Polyfilled in the spec (every real browser has it).
- **Read:** https://react-aria.adobe.com/Select

## 2026-10-04 — Fix: the library stopped bundling its dependencies
- **Fixed:** `vite.config.mts` only kept React out of `dist/index.js`, so TanStack, cva, tailwind-merge and React Aria were copied in (477 KB → now 57 KB). Every `dependencies` / `peerDependencies` entry is now external, read from package.json. `react` and `react-dom` are now `peerDependencies`. jsdom gaps moved to `src/test-setup.ts` (Vitest `setupFiles`).
- **Remember: a library imports, an app bundles.** A component library's build should only contain *its own* code. Its dependencies are installed and bundled once, by the app. Copies inside the library mean two React Arias (or Reacts) in one page, and context-based libraries break.
- **Remember: peerDependencies = "the app must provide this".** React is the classic one: there must be exactly one React in a page, the app's.
- **Read:** https://vite.dev/guide/build.html#library-mode

## 2026-10-04 — Combobox: type to search, 10k options, server search
- **Built:** `Combobox` on React Aria's `ComboBox`: browser filtering (`contains` / `startsWith`, ignores case and accents via `useFilter`), server search (`filter="none"` + `onInputChange` + `loading`), a virtualized list (`Virtualizer` + `ListLayout`, ~12 rows in the DOM for 10,000 options), Field wiring, and form posts of the option value (`formValue="key"`).
- **Remember: `aria-activedescendant`.** In a combobox, DOM focus never leaves the input (you must be able to keep typing). The highlighted option is pointed at by id: `<input aria-activedescendant="opt-7">`, and the screen reader reads that option. Select is different: there focus really moves into the list.
- **Remember: control the result, not the mechanics.** A first version let apps control the input text (`inputValue`). React Aria then stopped putting the picked label in the box and stopped resetting half-typed text on blur (found in the browser, not in tests). Fix: no `inputValue` prop; apps only *listen* (`onInputChange`).
- **Gotcha:** `defaultItems` = "React Aria filters these"; `items` = "already filtered by you". Pass the wrong one and filtering silently stops.
- **Read:** https://react-aria.adobe.com/ComboBox

## 2026-10-04 — MultiCombobox: several picks as tags
- **Built:** `MultiCombobox` on React Aria `ComboBox selectionMode="multiple"` + `TagGroup`. Picks show as tags inside the box (they wrap; the box grows), the text clears and the list stays open after each pick, Backspace in the empty input removes the last tag, and the form posts one entry per value. Shares its dropdown with `Combobox` (`combobox-parts.tsx`); both now use React Aria's `Group` as the field box.
- **Remember: a "grid" of tags is one Tab stop.** Tab lands on the tags once; ←/→ move between them (roving `tabindex`: only the current tag has `tabindex=0`). Delete removes one, and focus moves to the next tag, or to the input when none are left — never to `<body>`.
- **Remember: hidden collection pass.** React Aria finds a ComboBox's options by rendering its children once in a hidden tree. Other collections inside it (our TagGroup) must be wrapped in a *hideable* component (`ComboBoxValue`), or they render in that pass and crash.
- **Gotcha (tests):** while the list is open, React Aria sets `aria-hidden` on everything outside the input and list, so `getAllByRole('row')` "loses" the tags. Use `{ hidden: true }` to query them.
- **Read:** https://react-aria.adobe.com/TagGroup

## 2026-10-04 — DatePicker: a calendar day, not a moment
- **Built:** `DatePicker` on React Aria `DatePicker` (`DateInput` + `DateSegment` pieces, `Popover` → `Dialog` → `Calendar`). Value, `min`, `max` and the posted form value are ISO day strings (`'2026-10-04'`). Added `@internationalized/date` as a direct dependency (React Aria already used it; the build imports it, doesn't bundle it).
- **Remember: a date is not a `Date`.** `new Date(2026, 9, 4)` in Tokyo is midnight local = Oct 3, 15:00 UTC, so a UTC server stores Oct 3. A calendar day has no time zone; keep it as `'YYYY-MM-DD'` from the field to the database.
- **Remember: segments are spinbuttons.** Each piece (month, day, year) is its own `role="spinbutton"`: type digits (it jumps to the next piece when full) or ↑↓. Order follows the user's locale (US: mm/dd/yyyy). Alt+↓ opens the calendar; closing it puts focus back where you were.
- **Gotcha (tests):** segments take typed digits from the `beforeinput` event, not `keydown`. The spec fires `InputEvent('beforeinput', { data: '1' })`.
- **Read:** https://react-aria.adobe.com/DatePicker

## 2026-10-11 — DataGrid popover editors: searchable list and date cells
- **Built:** two new cell editor kinds on React Aria: `combobox` (searchable list, `options` or server `searchOptions` with debounce + `AbortSignal`) and `date` (ISO `'YYYY-MM-DD'` in and out, calendar on Alt+↓). A `PopoverEditorShell` routes Enter / Tab / Escape; every editor now fills a `CellEditorHandle` (`getValue()`, `focus()`). Demo invoices store dates as ISO strings. `Combobox` / `MultiCombobox` gained `selectedOptions` (labels for saved values not in the current results). The calendar popup moved to `calendar-popover.tsx`, shared by DatePicker and the grid.
- **Remember: capture phase runs first.** A keydown travels down (capture: `onKeyDownCapture`, parents first) and then back up (bubble: `onKeyDown`, target first). React Aria stops Enter in the bubble phase, so the shell listens in capture to see it at all.
- **Remember: read the value, not the text.** A combobox's input shows what you *searched* ("dev"), not what you *picked* ("DevOps"). The grid asks the editor's handle for the value instead of reading the input.
- **Gotcha: React events bubble through portals.** The list and calendar are portaled to `<body>`, but their clicks still reach the cell's React `onMouseDown`. Cells now ignore events whose DOM target isn't inside them.
- **Read:** https://react.dev/reference/react-dom/createPortal#event-bubbling-through-portals

## 2026-10-11 — Dialog and AlertDialog
- **Built:** `Dialog` (title, description, scrolling body, `footer` slot, ×; Escape or a click outside closes) and `AlertDialog` (role `alertdialog`, Cancel focused first, no outside-click close, async `onConfirm` with a spinner that stays open on failure). Both on React Aria `ModalOverlay` + `Modal` + `Dialog`. New `--fds-backdrop` token for the dimmed page.
- **Remember: a modal does three things.** Focus moves inside and is trapped there; everything behind is hidden from screen readers (`aria-hidden`) and can't be clicked or tabbed to; on close, focus goes back to the button that opened it. Without the last one, a keyboard user is dropped at the top of the page.
- **Remember: `dialog` vs `alertdialog`.** `alertdialog` is for a question that needs an answer now. Screen readers announce it as urgent, so it should be rare: one per destructive action, not for every message.
- **Gotcha (tests):** React Aria moves focus into the dialog on the next animation frame. Wait a frame before pressing keys, or Escape fires outside the dialog and nothing closes.
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

## 2026-10-11 — Menu
- **Built:** `Menu` (a trigger button + popup of actions) with `MenuItem` (`onAction`, `danger`, `disabled`, `description`, `shortcut`), `MenuSection` (title; `selectionMode` turns items into checkboxes or radios, e.g. "show columns") and `MenuSeparator`. On React Aria `MenuTrigger` + `Menu`. `buttonVariants` is now exported from `button.tsx` so the trigger looks exactly like a Button.
- **Remember: a menu is for actions, not values.** "Edit / Duplicate / Delete" is a Menu; "pick a status for this form" is a Select. Screen readers announce them differently (`menu` vs `listbox`), and a menu has no "current value".
- **Remember: a menu is not a Tab stop.** Arrows move inside; Tab leaves it, and the popup closes as soon as focus leaves. Escape closes it and puts focus back on the button.
- **Gotcha (tests):** while a menu is open, React Aria hides everything else from screen readers, including its own trigger. Query the trigger with `{ hidden: true }` while it's open.
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/

## 2026-10-11 — Popover
- **Built:** `Popover`: a trigger button + a floating panel (filters, details, a small form) on React Aria `DialogTrigger` + `Popover` + `Dialog`. Optional `title` (names the panel; without it, the trigger's label does), `panelSize`, `placement`, optional controlled `open` / `onOpenChange`, and children-as-a-function for `close`. Menu and Popover now share one internal `TriggerButton`.
- **Remember: modal vs. "light dismiss".** A Dialog dims the page and needs an answer. A Popover belongs to its button: the page stays visible, and Escape or any click outside closes it. While it's open, an invisible layer covers the page, so that first outside click only closes the popover: it never presses the button behind it by accident.
- **Remember: popups nest.** A Select inside a Popover opens its own popup; React Aria keeps a stack of open overlays, so picking an option closes only the top one.
- **Read:** https://react-aria.adobe.com/Popover

## 2026-10-11 — Tooltip
- **Built:** `Tooltip` (`content`, `placement`, `delay` = 700 ms, `disabled`) on React Aria `TooltipTrigger` + `Tooltip`, wrapping any focusable element through `Focusable`, so our native `<button>` Button stays as it is (option C of A/B/C).
- **Remember: keyboard focus shows it, mouse focus doesn't.** React Aria tracks the *interaction modality* (keyboard, pointer, or virtual). Clicking a button focuses it, but the mouse is already there, so a hint would only be in the way. Tabbing to it shows the hint, because a keyboard user has no hover.
- **Remember: description, not name.** The tooltip is wired with `aria-describedby`: screen readers say the button's own label first ("Export, button"), then the hint. An icon button without `aria-label` has no name at all.
- **Gotcha (tests):** jsdom here has `PointerEvent`, so hover means `pointerover` / `pointerout` with `pointerType: 'mouse'`, after one `pointerdown` so React Aria knows the mouse is in use.
- **Read:** https://react-aria.adobe.com/Tooltip

## 2026-10-11 — Alert
- **Built:** `Alert`, an inline message box (`info` / `success` / `warning` / `danger`) with `title`, details, an `actions` slot, optional `onDismiss`, and `announce`. No React Aria needed: it's plain markup plus the right role.
- **Remember: a live region only speaks when content *changes*.** `role="alert"` (urgent, interrupts) and `role="status"` (polite, waits) make screen readers read new content. An alert that's on the page from the start should have *no* live role, or it's read twice. That's why `announce` is opt-in.
- **Remember: never color alone.** Each alert starts with a hidden word ("Warning: …"), so the tone reaches people who can't see the color or the icon.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role

## 2026-10-11 — Spinner, ProgressBar, Skeleton
- **Built:** `Spinner` (indeterminate React Aria `ProgressBar`, named by `label`), `ProgressBar` (visible label, value text or `valueLabel` like "120 of 300 rows", indeterminate when there's no `value`) and `Skeleton` (`text` / `rect` / `circle` placeholders). `cssVars()` moved to `utils/` now that more than the grid uses it.
- **Remember: a Skeleton is silent on purpose.** Gray boxes read aloud are noise. The region that's loading says `aria-busy="true"`, and one status line says "Loading invoice…". The boxes are `aria-hidden`.
- **Remember: respect reduced motion.** `motion-reduce:` styles apply when the user turns animations down in their OS. The skeleton stops pulsing and the indeterminate bar stands still; the spinner only slows down, because a still spinner looks broken.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## 2026-10-11 — Toast
- **Built:** `toast.success / info / warning / danger / show / dismiss` plus `<ToastRegion />` (render once at the app root), on React Aria's `UNSTABLE_Toast`, wrapped so apps never see the unstable names. Errors and toasts with an action (Undo) stay until closed; others close after 5 s, pausing on hover or focus. `react-aria-components` is now pinned to `~1.21.1` (patch updates only).
- **Remember: a function API for a global thing.** A toast can be triggered from anywhere, including code that isn't a component (an API error handler), so it's a module-level queue with plain functions. No hook, no context provider.
- **Remember: timing is an accessibility rule.** WCAG 2.2.1 says people must get enough time. A message that needs reading or an action (an error, Undo) must not vanish on a timer.
- **Remember: check the source, not your assumptions.** I first wrote that the toast region exists before messages arrive. It doesn't: each toast is an `alertdialog` with a `role="alert"` inside, revealed one render late so NVDA notices. The docs were corrected before the PR.
- **Read:** https://react-aria.adobe.com/Toast

## 2026-10-11 — EmptyState
- **Built:** `EmptyState` (`title`, required `headingLevel`, `description`, decorative `icon`, `action`, `size: default | compact`). It drops into the DataGrid's existing `emptyMessage` slot. This completes Tier 3: Alert, loading states, Toast, EmptyState.
- **Remember: "no data yet" and "no results" are different states.** Same box, different words and a different action: *create the first one* vs. *loosen the search*. One generic "Nothing here" fails both.
- **Remember: required props for structure.** Like `Heading`, the heading level has no default. A component can't know where it sits in the page outline, and a wrong level breaks screen-reader navigation by headings.
- **Read:** https://www.nngroup.com/articles/empty-state-interface-design/

## 2026-10-11 — NumberField and TextArea
- **Built:** `NumberField` on React Aria (formats with `Intl.NumberFormat` options: currency, percent, decimals; ↑/↓ and −/+ to step; `min` / `max` / `step`; the app gets a plain `number | null`, and forms post the plain number). `TextArea`: native, styled like Input, grows with its text, with an optional "12 / 500" counter.
- **Remember: format for people, store for machines.** The field shows `$1,234.50` in the user's locale, but the app only ever sees `1234.5`. Formatting is a display concern, like ISO dates: never send "$1,234.50" to a backend.
- **Remember: numbers vs. number-looking codes.** A PO number or a postal code is text; a NumberField would drop its leading zeros and add commas. Use NumberField only when doing maths on the value makes sense.
- **Remember: don't announce every keystroke.** The character counter is linked with `aria-describedby` (read on focus), not a live region, which would talk over the user while they type.
- **Read:** https://react-aria.adobe.com/NumberField

## 2026-10-11 — RadioGroup and Switch
- **Built:** `RadioGroup` + `Radio` (label, description, error, required, horizontal or vertical, per-radio description) and `Switch`, both on React Aria with native inputs underneath.
- **Remember: a radio group is one Tab stop.** Tab lands on the chosen radio, arrows move *and* choose, Tab leaves. Choosing with arrows is the standard; it surprises people who expect Space.
- **Remember: Switch vs. Checkbox.** A Switch acts *now* (like a light switch: "Email me when paid"). A Checkbox is a choice applied on submit ("I accept the terms"). Same input underneath; screen readers say "on/off" for a switch and "checked" for a checkbox.
- **Gotcha (tests):** jsdom's `fireEvent.click` fires on disabled inputs, which real browsers never do. Test the `disabled` attribute instead of clicking it.
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/radio/

## 2026-10-11 — CheckboxGroup
- **Built:** `CheckboxGroup` + `CheckboxGroupItem` on React Aria (group label, description, error, required, orientation; value is `string[]`; forms post one entry per checked value). Items look exactly like `Checkbox`, which stays for single boxes. Completes Tier 2: NumberField, TextArea, RadioGroup, Switch, CheckboxGroup.
- **Remember: checkboxes are separate Tab stops, radios are one.** Radios are one choice, so arrows move through them. Checkboxes are independent yes/no answers, so each one gets Tab and Space.
- **Remember: two components beat one that changes meaning.** React Aria's group needs its own items, so a separate `CheckboxGroupItem` keeps `Checkbox` simple and native, instead of a Checkbox that behaves differently depending on its parent.
- **Read:** https://react-aria.adobe.com/CheckboxGroup


## 2026-10-11 — Tabs
- **Built:** `Tabs`, `TabList`, `Tab`, `TabPanel` on React Aria (string `value`/`defaultValue`/`onChange`, disabled tabs, `keyboardActivation` automatic or manual). Starts Tier 4 (navigation and layout).
- **Remember: automatic vs. manual activation.** Automatic (default): ←/→ move *and* show the panel. Manual: arrows only move focus, Enter or Space shows it. Pick manual when panels are slow to load.
- **Remember: tabs switch views, links change pages.** If clicking it changes the URL to a new page, it's navigation (links), not tabs.
- **Gotcha:** React Aria calls `onSelectionChange` on mount when it picks the first tab itself. Our wrapper skips that call, so `onChange` only means "the user picked a tab".
- **Read:** https://react-aria.adobe.com/Tabs

## 2026-10-11 — Breadcrumbs + Pagination
- **Built:** `Breadcrumbs` (an `items` array, on React Aria `Breadcrumbs` + `Link`) and `Pagination` (our own: Previous, page numbers with "…" gaps, Next, built on `Button`). Both sit inside a `<nav>` landmark with `aria-current="page"` on the current item.
- **Remember: `disabled` vs. `aria-disabled`.** A `disabled` button drops focus, so pressing Next onto the last page would throw keyboard users to the top of the page. `aria-disabled` looks and reads as disabled but keeps focus, and the click handler ignores it.
- **Remember: keep the layout still.** Pagination always shows the same number of items (first, last, current ± siblings, gaps), so the buttons don't move under the mouse while you click through.
- **Remember: several `<nav>`s need different names.** Screen readers list landmarks by name ("Breadcrumbs", "Pagination"), so two pagers on one page need their own `aria-label`.
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/

## 2026-10-11 — AppShell + PageHeader
- **Built:** `AppShell` (top bar, sidebar, `<main>`, skip link; below 1024px the sidebar becomes a React Aria modal drawer), `SideNav` / `SideNavSection` / `SideNavItem` (`aria-current="page"`), and `PageHeader` (breadcrumbs, the page's one `h1`, description, actions). Completes Tier 4.
- **Remember: the skip link.** It's the first thing Tab reaches, hidden until focused. Enter jumps to `<main tabindex="-1">`, so keyboard users skip the whole sidebar in 2 key presses instead of 15+.
- **Remember: landmarks are a table of contents.** `<header>`, `<nav>`, `<main>` let screen-reader users jump straight to a region. One `<main>` per page; each `<nav>` gets its own name.
- **Gotcha:** a story's module-level `const nav = <SideNav … icon={<HomeIcon />} />` ran before `HomeIcon` was defined lower in the file (the "temporal dead zone"). Typecheck caught it; wrapping it in a component delays it until render.
- **Read:** https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/

## 2026-10-11 — Pagination page-size picker
- **Built:** `pageSize`, `pageSizeOptions` and `onPageSizeChange(pageSize, page)` on `Pagination`: a "Rows per page" Select beside the page buttons (outside the `<nav>`, since it isn't navigation).
- **Remember: keep the user's place.** Switching page size should keep the first visible row on screen: page 5 of 25s (rows 101–125) → page 3 of 50s. Jumping to page 1 is common, but it loses where they were. `pageForSize` does the math: `floor((page - 1) × oldSize / newSize) + 1`.
- **Remember: hand the caller the answer, not the chore.** `onPageSizeChange` passes the new page too, so every app gets this right without writing the formula itself.
- **Read:** https://react-aria.adobe.com/Select

## 2026-10-11 — Collapsing long breadcrumb trails
- **Built:** `maxItems` on `Breadcrumbs`: the first item, a "…" menu with the hidden levels as links, and the last `maxItems - 1` items. `MenuItem` gained `href`, so any menu item can be a link.
- **Remember: three ways to shorten a trail.** Link "…" to the parent (loses the levels in between), expand it in place (the trail jumps to several lines), or open a menu (one line, every level still one step away). We picked the menu.
- **Remember: name icon-like buttons by what they do.** "…" means nothing read aloud, so the button is named "Show 3 more levels".
- **Read:** https://react-aria.adobe.com/Menu#links

## 2026-10-11 — Collapsible sidebar
- **Built:** a collapse button at the bottom of AppShell's wide sidebar (64px, icons only, labels as tooltips), with `sidebarCollapsed` / `defaultSidebarCollapsed` / `onSidebarCollapsedChange`. SideNav reads the state from context, so app nav code doesn't change.
- **Remember: `sr-only`, not removed.** A collapsed item hides its label visually but keeps it in the page, so the link is still "Invoices, link, current page". Deleting the text would leave an unnamed link.
- **Remember: controlled *or* uncontrolled.** `defaultX` lets the component keep the state; `x` + `onXChange` lets the app own it (e.g. to save it). We support both with `x ?? ownState`.
- **Remember: keep the tree stable.** The Tooltip is always rendered and only `disabled` when expanded. Adding or removing a wrapper would remount the link and drop keyboard focus.
- **Read:** https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components

## 2026-10-11 — Menu submenus
- **Built:** `MenuSubmenu` ("Export as ▸ CSV / Excel / PDF") on React Aria `SubmenuTrigger`: the parent item gets `aria-haspopup="menu"` + `aria-expanded` and a ▸ chevron; the submenu opens beside it.
- **Remember the keys:** → or Enter opens the submenu on its first item; ← or Escape closes **only** the submenu and puts focus back on its parent item; Enter on an item runs it and closes the whole menu. In right-to-left languages ← and → swap.
- **Remember: "alpha" APIs get the same care as `UNSTABLE_` ones.** One file imports `SubmenuTrigger`, nothing in our public types mentions it, and React Aria stays patch-pinned (recipe rule 22).
- **Read:** https://react-aria.adobe.com/Menu#submenus

## 2026-10-11 — Dialog and drawer animations
- **Built:** Dialog/AlertDialog backdrop fade + panel pop (150ms in, 100ms out) and the AppShell drawer slide (mirrored in RTL), as named animations in `@theme` driven by React Aria's `data-entering` / `data-exiting`. No new dependency.
- **Remember: React Aria waits for exit animations.** On close it keeps the dialog in the page with `data-exiting` until the animation ends, *then* removes it and returns focus to the button. (Checked in Chromium: still there right after Escape, gone and focus restored 250ms later.)
- **Remember: animate with `motion-safe:`, don't cancel with `motion-reduce:`.** `.x[data-entering]` (class + attribute) beats `.y` in a media query, so `motion-reduce:animate-none` silently lost and reduced-motion users still got the animation. Only a real browser caught it; jsdom doesn't run CSS animations.
- **Read:** https://react-aria.adobe.com/Modal#animation

## 2026-10-11 — Tooltip kind="label"
- **Built:** `Tooltip kind="label"` for hints that only repeat the element's own name (collapsed sidebar icons). SideNav uses it, so screen readers no longer say "Invoices" twice.
- **Remember: how a description is computed.** `aria-describedby` is followed even to hidden elements, so `aria-hidden` on the tooltip does nothing. But inside the referenced element, `aria-hidden` *children* are skipped. Hiding the text inside the tooltip empties the description while it stays on screen.
- **Remember: check names and descriptions in a real browser.** Chrome's accessibility tree (via DevTools or CDP `Accessibility.getPartialAXTree`) is the source of truth; jsdom doesn't compute it.
- **Read:** https://www.w3.org/TR/accname-1.2/#mapping_additional_nd_description

## 2026-10-11 — Popup animations
- **Built:** one shared motion for every popup: Popover, Menu + submenus, Select, Combobox, MultiCombobox, DatePicker calendar (fade + scale from 96%, 120ms in, 80ms out), and Tooltip (fade only). One class string in `utils/motion.ts`, so they can't drift apart.
- **Remember: grow out of the trigger.** React Aria sets `--trigger-anchor-point` on each popup, the point that touches its trigger (for a start-aligned menu below a button: its top-start corner). `origin-(--trigger-anchor-point)` makes the scale start there.
- **Remember: slow animations down to test them.** A 120ms animation is over before a script can look. Chrome DevTools (or CDP `Animation.setPlaybackRate`) can run them at 10% speed.
- **Read:** https://react-aria.adobe.com/Popover#animation

## 2026-10-11 — Combobox autoHighlight
- **Built:** opt-in `autoHighlight` on `Combobox` (and always on in the grid's combobox cell editor): as you type, the first enabled match is highlighted, so Enter picks it without ↓. ARIA calls this "list autocomplete with automatic selection".
- **Remember: read the library's source before changing a default.** React Aria picks the highlighted option on **Tab** as well as Enter. In a grid that's what you want; in a form, "type 'ca', Tab away" would silently choose Canada. So it's opt-in.
- **Remember: effects run child first, parent last.** React Aria clears the highlight in the ComboBox's own effect whenever the text changes, which runs after ours. A `queueMicrotask` runs after the whole batch of effects, so our highlight sticks.
- **Gotcha:** don't highlight before the user types. On opening an existing value the list shows everything, and "first option" would replace the current value on Enter.
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/

## 2026-10-11 — Date cell type-to-replace
- **Built:** typing a digit on a date cell opens the editor *with* that digit in the first segment (month in en-US); typing carries on across segments. Other keys just open the editor. Completes the small follow-ups batch.
- **Remember: "1" waits, "2" jumps.** After "1" the month could still be 10–12, so the segment waits; after "12" no month is longer, so focus moves to the day. React Aria decides this per segment.
- **Remember: drive components through the platform's own events.** React Aria date segments read typed text from the native `beforeinput` event, so dispatching one is the same path a real key takes. Verified with a real (trusted) key press in Chromium, not only the synthetic event in jsdom.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event

## 2026-10-11 — Grid combobox: one Enter on an unchanged value
- **Fixed:** Enter on a combobox (or date) cell whose value you didn't change now commits and moves down in one press, like Tab already did. Before, the first Enter only closed the list.
- **Remember: capture vs. bubble.** The editor shell sees keys twice: in the *capture* phase (before React Aria) and the *bubble* phase (after). With the list open, Enter must reach React Aria first so it can pick the highlighted option; only afterwards, in bubble, do we check "is the list closed now?" and commit. Committing in capture would save the old value instead of the pick.
- **Remember: prove a test catches the bug.** Run it against the old code once and watch it fail; a test that passes either way protects nothing.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/API/Event/eventPhase

## 2026-10-11 — FileUpload
- **Built:** `FileUpload`: drop zone (React Aria `DropZone`: drag, and paste with Ctrl/⌘+V), "Browse files" (`FileTrigger`), `accept` / `maxSize` / `maxFiles` / `multiple`, a file list with Remove, refusals with reasons, and a live status for screen readers. It chooses files; uploading stays the app's job.
- **Remember: three ways in, so nobody is stuck.** Drag (mouse), Browse (keyboard, touch), paste (keyboard). React Aria's DropZone also has a hidden drop button so screen-reader users can paste into it.
- **Remember: accept the drop, then explain.** Refusing a drag only shows a "no entry" cursor with no reason. Taking the files and listing "archive.zip isn't an accepted file type" tells people what to fix.
- **Remember: when a focused button disappears, put focus somewhere sensible.** Remove moves focus to the next file's Remove, or Browse when the list is empty.
- **Gotcha (testing):** a page script can't fake a desktop file drag (`effectAllowed` stays "none" outside a real drag). Chrome DevTools' `Input.dispatchDragEvent` drags real files from disk.
- **Read:** https://react-aria.adobe.com/DropZone

## 2026-10-12 — ReorderableList
- **Built:** `ReorderableList` (React Aria `GridList` + `useDragAndDrop`): ⠿ handle per row, a drop line, the dragged row faded in place, optional `renderEnd` (e.g. a Switch per column). Controlled only (`items` + `onReorder`); the move itself is a pure `moveItems()`.
- **Remember the keyboard flow:** ↑↓ to a row, **→ onto its ⠿ handle**, Enter picks it up; ↑↓ then walk the *gaps* ("Insert between Status and Issued"), Enter drops, Escape cancels. React Aria announces each step. In a grid, → moves *into* a row's controls.
- **Remember: read the source, then test the real thing.** I first guessed Enter on the row; React Aria's source and a Chromium run showed the handle is the keyboard entry point when a list has one. jsdom can't run its drag manager at all, so drags are verified in Chromium.
- **Gotcha:** `GridListItem` names a row from `textValue` and drops `aria-describedby`, so a second line has to go into the name ("Customer, Company name").
- **Read:** https://react-aria.adobe.com/dnd

## 2026-10-12 — ReorderableList: Alt+↑/↓ shortcut
- **Built:** Alt+↑/↓ on a row (or its ⠿ handle) moves it one step and announces "Moved Status to position 4 of 6" (or "Invoice is already first"). It reuses `moveItems()`. The full keyboard drag still works for long moves.
- **Remember: `onKeyDownCapture` sees a key before the handlers below it.** `GridListItem` has no `onKeyDown` prop, so a wrapper `div` catches Alt+arrows in the capture phase and calls `stopPropagation()`. That stops React Aria's own ↓ from also moving focus.
- **Remember: moving a focused DOM node drops focus.** Moving "Status" **down** made React move that node. The browser then blurred it to `<body>`, and React Aria put focus back (it remembers the focused key). Moving **up** made React move the *neighbour*, so focus never left. Check this in a real browser, never assume.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#capture

## 2026-10-12 — FileUpload: upload progress, Retry, Cancel
- **Built:** an `upload(file, { onProgress, signal })` prop. Each new file is sent right away. Its row shows a progress bar and %, then ✓, or the reason plus **Retry**. The ✕ cancels while sending. State lives in a `useUploads` hook, keyed by the `File` object itself. `ProgressBar` gained `hideLabel`.
- **Remember: `AbortController` is how you cancel async work.** The hook makes one per upload and passes `signal` to your function (and from there to `fetch`). Cancel, removing a file and unmounting all call `abort()`. A late answer from an aborted upload is ignored (`if (signal.aborted) return`).
- **Remember (the prediction): when the focused button disappears, focus falls to `<body>`.** Retry vanishes once the row is uploading again, so the code moves focus to the row's ✕. That button stays in every state and only its name changes. The test fails without the fix (it was checked).
- **Gotcha:** one `role="status"` region plus two uploads finishing at once means React merges the updates and the first message is lost. Collect messages for one tick, then announce them together.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/API/AbortController

## 2026-10-12 — DateRangePicker
- **Built:** `DateRangePicker` (React Aria `DateRangePicker` + `RangeCalendar`). Value is `{ start, end }` ISO strings, plus `min`/`max`, Field support and `startName`/`endName` for forms. The field box, date pieces and calendar button moved to `date-field-parts.tsx`; the month header and day grid are shared in `calendar-popover.tsx`, so both pickers use one copy.
- **Remember (the prediction):** after the first click, React Aria keeps an *anchor*. The band follows the mouse (or arrow keys) as a preview, and `onChange` is **not** called until the second click. Half a range is not a value. With the keyboard, Enter on the start also moves focus one day on, so the preview shows at once (`focusNearestAvailableDate`).
- **Remember: in React Aria, `isInvalid={false}` means "never invalid".** It switched off React Aria's own checks: a typed day outside `min`/`max`, an end before the start. Pass `true` or `undefined`, never `false`. This fixed the same bug in `DatePicker`.
- **Gotcha (tests):** calendar day names carry extras ("Selected Range: … to …", "First available date"), so the tests find days by their number instead of their name.
- **Read:** https://react-aria.adobe.com/DateRangePicker

## 2026-10-12 — DateRangePicker: quick picks (presets)
- **Built:** a `presets` prop on `DateRangePicker`, shown as a column of buttons beside the calendar. One click sets both ends and closes the popover; the matching one is `aria-pressed`, and one reaching outside `min`/`max` is disabled. `commonRangePresets(today?)` gives the usual six: Today, Last 7/30 days, Month to date, Last month, Year to date.
- **Remember (the prediction): ranges count both ends.** "Last 7 days" on Oct 12 is **Oct 6 – 12** (`today.subtract({ days: 6 })`), not Oct 5. Off-by-one here gives an 8-day report.
- **Remember: let the date library do month and year maths.** `startOfMonth`, `endOfMonth` and `subtract({ months: 1 })` from `@internationalized/date` get Feb 29, Dec 31 → Jan 1 and 30-vs-31-day months right. The tests cover a leap year and a year boundary.
- **Remember: React Aria exposes each component's state through a context** (`DateRangePickerStateContext`). Our own part inside the popover can read and set the value (`state.setValue`, `state.setOpen(false)`) without new props.
- **Read:** https://react-aria.adobe.com/internationalized/date/CalendarDate

## 2026-10-12 — TagGroup (chips)
- **Built:** `TagGroup` (React Aria `TagGroup`), with removable chips (`onRemove`: ✕ button + Delete/Backspace) and toggle chips (`selectionMode`, ✓ when selected). It has its own label, description and error, plus `emptyText`. The chip look moved to `tag-parts.tsx`, shared with `MultiCombobox`.
- **Remember (the prediction): React Aria moves focus for you.** After a Delete, focus goes to the next chip, or the previous one at the end. When the *last* chip goes, focus moves to the empty list itself, now a `group` still named "Active filters". Focus never falls to `<body>`, but our `outline-hidden` made that spot invisible, so the list needed its own focus ring.
- **Remember: never show state by color alone (WCAG 1.4.1).** Selected chips were a yellow tint only in the first screenshot; now they also get a ✓. Screen readers get `aria-selected`.
- **Remember: a grid of chips is one Tab stop**, with ←/→ inside it. Fifty chips would otherwise be fifty Tab presses.
- **Read:** https://react-aria.adobe.com/TagGroup

## 2026-10-12 — SegmentedControl
- **Built:** `SegmentedControl` (React Aria `ToggleButtonGroup`, single mode → `radiogroup` of `radio`s). One option is always on (`disallowEmptySelection`). It supports icons, `iconOnly` (the label becomes the name and a `Tooltip kind="label"`), disabled options and sizes.
- **Remember (the prediction): ←/→ only move focus; Space/Enter choose.** Passing over "Month" doesn't load a month of data on the way to "Quarter". That's the reason to pick this over a RadioGroup (where arrows choose as they move) for settings that trigger work. Tabs are for switching *panels*, not settings.
- **Remember: check what the ARIA role promises.** It says `radiogroup`, so Tab should land on the *checked* radio. React Aria starts on the first, as for a toolbar, so an `onFocusCapture` sends focus that enters from outside to the chosen segment.
- **Remember: measure state contrast (WCAG 1.4.11, 3:1).** The selected pill was only 1.17:1 against the track in both themes. A `ring-border-strong` outline (3.7:1) fixed it. Also, `onChange` now fires only on a real change: React Aria reports the same segment again when it's pressed twice.
- **Read:** https://react-aria.adobe.com/ToggleButtonGroup

## 2026-10-12 — Audit: isInvalid and where Tab lands
- **Did:** checked every component for the two bug kinds found this week. Result: **no new code bugs**. I added recipe rules 24 and 25, a comment at each `isInvalid`, and a CheckboxGroup test that locks the rule in.
- **Remember (the prediction): `required` is not shown live in `aria` mode.** A required DatePicker cleared and blurred stays un-red. React Aria shows `required` only when validation is committed, so the #48 change caused no regression.
- **Remember: read the library's code when tests disagree.** jsdom's form submit gave mixed results. `useFormValidationState` settled it: shown error = our `isInvalid` if set, else React Aria's built-in checks. So `false` is a choice per component, not a bug pattern. It's wrong only where React Aria checks something users need (date ranges).
- **Remember: Tab-lands-on-selected is checked in a real browser**, with the selected item *not* first. React Aria gets it right for Tabs, TagGroup, Select and Calendar. Only ToggleButtonGroup (SegmentedControl) didn't.
- **Read:** https://react-aria.adobe.com/forms#validation

## 2026-10-12 — Disclosure + Accordion
- **Built:** `Disclosure` (one collapsible section, title = heading + button with `aria-expanded`, `headingLevel` default 3) and `Accordion` (React Aria `DisclosureGroup`: one open by default, `allowsMultiple`, controlled `expandedIds`). It slides open via React Aria's `--disclosure-panel-height`, `motion-safe` only.
- **Remember (the prediction): Ctrl+F finds text in closed sections and opens them.** React Aria hides a closed panel with `hidden="until-found"`, not `display:none`. The browser searches it, fires `beforematch` on a match, and React Aria opens the section. Tested with a text-fragment link (`#:~:text=Credit notes`), which uses the same path. (`window.find()` doesn't: it's non-standard and fires no `beforematch`.)
- **Remember: when two CSS rules fight, pass the fact in code.** `in-data-accordion:border-0` on each item also wiped out the group's `divide-y` dividers (both set border width). A React context (`InAccordion`) now lets the item pick its classes, so there's no specificity or ordering puzzle.
- **Remember: accordions are headings + buttons, not one widget.** Tab moves between titles (no arrow-key roving), so screen-reader users can also jump by heading.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden#the_hidden_until_found_state

## 2026-10-12 — Stepper
- **Built:** `Stepper` ("Details → Billing → Review"), an `<ol>` with `aria-current="step"` on the current step. Each status is also in words ("Details, completed", "Review, not started"). `onStepClick` turns *completed* steps into buttons (never upcoming ones). There's a vertical layout with descriptions, and on phones only the current label shows.
- **Remember: not everything needs a headless library.** React Aria has no stepper because there's no widget, just a list that marks a position. Plain semantic HTML plus one ARIA attribute is the whole accessibility story.
- **Remember (the prediction): the list and `aria-current` do the talking.** A screen reader says "list, 4 items" … "Billing, current step, 3 of 4". The "3 of 4" comes from the `<ol>`; "current step" comes from `aria-current="step"`. Chromium's DevTools accessibility API doesn't list `aria-current` at all (not even on a link), so that part is per spec, not observed.
- **Remember: `flex-1` vs `flex-auto`.** `flex-1` starts every item at 0 and splits *all* the space, so a step with a longer label got a shorter line. `flex-auto` starts at content size and splits only the extra space, so the lines come out equal.
- **Read:** https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current

## 2026-10-12 — SearchField
- **Built:** `SearchField` (React Aria `SearchField`): 🔍 + `type="search"` input + ✕. Enter → `onSubmit`, Escape or ✕ → clear (`onClear`). `loading` swaps the 🔍 for a spinner, and it works in `Field` like `Input`. The ✕ shows only with text, is named "Clear search", and isn't a Tab stop.
- **Remember (the prediction): Escape is handled only when there's something to clear.** In a Dialog, the first Escape clears the search (focus stays), the second closes the dialog. React Aria lets Escape through when the field is empty. Verified in Chromium; a test checks the empty case reaches the parent.
- **Gotcha (screenshots): wait for the theme.** The theme addon sets `data-theme` on `<html>` in an effect *after* the story renders, so a fast screenshot can be light in "dark". The scripts now wait for `html[data-theme=…]`. This was probably also the real cause of the light "Narrow" shot in #54, which I blamed on the viewport parameter.
- **Read:** https://react-aria.adobe.com/SearchField

## 2026-10-12 — Toolbar
- **Built:** `Toolbar` (React Aria `Toolbar`, `role="toolbar"`) with `ToolbarGroup` (named `group`) and `ToolbarSeparator`. One Tab stop for a set of actions; ←/→ (or ↑/↓ when vertical) move between them. It holds our existing Button, Menu and icon Buttons with Tooltip.
- **Remember (the prediction): the toolbar remembers.** Tab in → → → Tab out → Shift+Tab lands back on **"Archive"**, the last button used, not the first. That's the point: a keyboard user returning to the toolbar picks up where they left off.
- **Remember: check what the library *actually* does.** I wrote "Home/End jump to the ends" in the JSDoc; Chromium showed React Aria's Toolbar doesn't do that, so the claim came out. Also React Aria didn't give the `<hr>` separator any orientation here (horizontal in both layouts), so the Toolbar passes its direction through a React context. Same fix as the Accordion.
- **Remember: don't nest arrow-key controls in a toolbar** (inputs, SegmentedControl, Slider): both would claim ←/→. And in a vertical toolbar, tooltips go to the side (`placement="end"`) so they don't cover the neighbours.
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
