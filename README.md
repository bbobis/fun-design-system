# Fun Design System

React + TypeScript + Tailwind CSS component library, built as an Nx monorepo.

## Requirements

- Node 22.12 or newer
- npm 11 or newer (`npm -v`; upgrade with `npm i -g npm@11`)

## Getting started

```sh
npm install
npx nx storybook ui      # component workshop at http://localhost:6006
```

## Commands

| What | Command |
|---|---|
| Storybook | `npx nx storybook ui` |
| Unit tests | `npx nx test ui` |
| Lint | `npx nx lint ui` |
| Typecheck | `npx nx typecheck ui` |
| Build the library | `npx nx build ui` |
| Run everything | `npx nx run-many -t lint typecheck test build build-storybook` |

## Layout

```
packages/ui/            the component library (@fun-design-system/ui)
  src/styles/index.css  entry stylesheet: fonts + Tailwind + tokens
  src/styles/fonts.css  IBM Plex Sans + IBM Plex Mono (Fontsource)
  src/docs/             Storybook docs pages
  .storybook/           Storybook config
docs/learning-log.md    what was built and learned, per task
```
