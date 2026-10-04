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
