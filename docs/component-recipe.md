# Component recipe

How every component in `packages/ui` is built. Button is the reference; copy its shape.

## Files

```
src/components/<name>/
  <name>.tsx          the component + its cva recipe + ButtonProps type
  <name>.spec.tsx     Vitest + Testing Library
  <name>.stories.tsx  Storybook: Playground, then one story per concept
  index.ts            export { Name, type NameProps }
src/index.ts          export * from './components/<name>'
```

## Rules

1. **Semantic tokens only.** `bg-primary`, `text-fg`, `border-border-strong`. Never a raw scale
   (`bg-yellow-500`) in a component. If a component needs a color that has no token, add the
   token in `tokens.css` first.
2. **Variants with `cva`, classes merged with `cn()`.** Variants are *how it looks* (`intent`,
   `size`); states are *what's happening* (`disabled`, `loading`, `aria-invalid`). States are
   plain props or ARIA attributes, not cva variants.
3. **Props = native element props + variants + a few extras.**
   `ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { loading?: boolean }`.
   Apps can pass any native attribute (`aria-label`, `data-*`, `form`) and a `className`.
   `ref` is a normal prop in React 19; no `forwardRef`.
4. **Native element first.** A `<button>` gets Enter, Space, focus and form behavior for free.
   Reach for a headless library only when the native element can't do the job (Dialog, Menu).
5. **Focus is visible and keyboard-only:** `focus-visible:outline-2 focus-visible:outline-offset-2
   focus-visible:outline-focus-ring`. Don't add `outline-none` (it breaks the focus rule in
   Tailwind v4).
6. **Safe defaults.** `type="button"` on buttons. A disabled-looking "busy" state uses
   `aria-disabled` + `aria-busy`, not `disabled`, so focus doesn't jump.
7. **JSDoc on every prop that isn't obvious,** with `@default`. Storybook autodocs shows it.
   Keep `@example` out of the component's own JSDoc; it renders as stray text in the docs
   header. Put examples in stories instead.

## Tests to write for every component

- renders the right element and role
- the default that prevents a footgun (e.g. `type="button"`)
- each state blocks or allows interaction as intended
- `className` override wins over the component's own class
- native attributes pass through; `ref` reaches the DOM node

## Stories to write

- `Playground` with controls
- one story per variant axis (`Intents`, `Sizes`)
- `States`
- anything keyboard-related gets its own story with a one-line instruction
