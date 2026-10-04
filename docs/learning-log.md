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
