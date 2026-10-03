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
