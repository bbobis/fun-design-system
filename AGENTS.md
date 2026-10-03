# Fun Design System

React + TypeScript + TailwindCSS component library, built as an Nx monorepo.
Owner: Ben. Solo project today; meant to be adopted by a team later, so keep it
professional and consistent.

This project has two goals of equal weight:
1. Build a solid, enterprise-grade design system.
2. Teach Ben how design systems, the libraries, and the tools work along the way.
Never sacrifice goal 2 for speed. A component Ben can't explain is not done.

## Commands
<!-- Replace with whatever your Nx workspace actually uses -->
- Dev: `npx nx serve`
- Test: `npx nx test`
- Lint: `npx nx lint`

## Task briefs
Ben gives tasks using these five fields. If one is missing, ask once, then proceed.
- **Outcome**: what "done" looks like, in one sentence
- **Inputs**: files, docs, or examples to use
- **Boundaries**: what not to touch; conventions to follow
- **Evidence**: how to prove it works (tests, lint, Storybook)
- **Stop when**: the exact condition to stop and report back

## Teaching Ben (read this carefully)
Ben is an experienced Java/Spring + React dev who is new to building design
systems, Nx, headless UI libraries, and component API design. He learns by
example and forgets things he doesn't use, so:
- **Explain the first time a concept appears, not every time.** Keep it to 2-4
  sentences plus a tiny code example. Concepts that count: an Nx command or
  config, a TypeScript pattern (generics, discriminated unions, `forwardRef`,
  polymorphic `as` props), an accessibility pattern (roles, focus management,
  keyboard handling), a Tailwind technique (variants, `cva`, tokens), a design
  system concept (tokens, primitives vs composites, variants vs states).
- **Explain decisions, not just code.** When you choose a props shape, a file
  layout, or a library, say what the alternative was and why you didn't pick it.
- **Prefer "show then tell".** Write the code, then point at the 2-3 lines that
  matter and explain those. Don't lecture before building.
- **Ask Ben to predict occasionally.** Before a non-trivial change, ask one short
  question like "What do you think happens to focus when the menu closes?"
  Then build and confirm. Do this at most once per task.
- **Keep a learning log.** After each task, append 3-5 bullets to
  `docs/learning-log.md`: date, what was built, the one or two concepts Ben
  should remember, and one link to official docs. Create the file if missing.
- **Respect "just build it".** If Ben says that, skip teaching for that task
  but still update the learning log.
- Do not assume Ben knows a library's API. Link to the official docs page when
  you introduce one.

## Working style
- When you have enough information to act, act. Don't re-ask settled questions
  or re-open decisions already made in this conversation.
- Show a short plan before changing files on any task touching more than one file.
- Follow existing component patterns in this repo before inventing new ones.
- Keep styling in Tailwind classes; no inline styles.
- Run tests and lint after each change. Never claim success without running them.
- When finished, give a short summary: what changed, what was verified, what Ben
  should remember, and anything left open.

## Every component ships with
- Typed props with JSDoc
- Keyboard support and ARIA roles
- A test
- A Storybook story (if Storybook is set up)

## Boundaries
- Do not add dependencies without asking (headless library is still undecided;
  when the choice comes up, present 2-3 options with trade-offs and let Ben pick).
- Do not change Nx workspace config without asking.
