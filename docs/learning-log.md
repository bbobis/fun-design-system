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

## 2026-10-03 — Phase 4, step 1: hand-built Dialog (lab)

- **Built:** `src/lab/dialog-handmade/` — a modal with no headless library, 7 tests, 2 stories under *Lab/*. Not exported from the package (confirmed: 0 references in `dist`). A reference for comparing libraries, not a component to use.
- **Remember: the 10 jobs a modal has.** ① remember the opener ② move focus in ③ lock page scroll ④ make the page behind `inert` ⑤ return focus on close ⑥ Esc closes ⑦ trap Tab ⑧ portal to `<body>` ⑨ backdrop click ⑩ `role="dialog"` + `aria-modal` + `aria-labelledby`/`describedby`. ~100 lines, and the file ends with 8 things it still gets wrong (nested dialogs, scrollbar jump, iOS scroll, exit animations, choosing the initial focus…).
- **Remember: return focus to the opener.** Otherwise a keyboard or screen-reader user lands at the top of the page and has to Tab all the way back. Cleanup order matters: remove `inert` *before* calling `.focus()`, or the opener can't receive it.
- **Remember: `inert` > `aria-modal`.** `aria-modal="true"` is a hint some screen readers ignore. `inert` on everything outside actually removes it from clicks, Tab and the accessibility tree.
- **Read:** https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
