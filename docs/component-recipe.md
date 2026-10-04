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

8. **Primitives vs composites.** A primitive is one element (`Input`, `Label`). A composite
   wires primitives together (`Field` = Label + control + description + error). Composites
   share wiring through React context (`FieldContext`), so the app writes
   `<Field label="Email"><Input /></Field>` and never handles ids itself.
9. **State in ARIA, style from ARIA.** Error state is `aria-invalid`, and the style is
   `aria-invalid:border-danger`. Styling and accessibility can't drift apart.
10. **Explicit props win over context.** `<Input invalid={false} />` inside an invalid Field
    stays valid; the Field's values are defaults.

11. **Polymorphic `as` for content components** (`Text`, `Card`): a small union of allowed
    tags, a generic `T`, and `Omit<ComponentProps<T>, 'as'>`, so `<Text as="span">` gets span
    props and a span ref. Inside, cast once: `const Component = (as ?? 'p') as ElementType;`
    (TS can't prove `rest` fits every tag). Add a `@ts-expect-error` test so the public type
    stays strict. Don't make *interactive* components polymorphic; a Button is a `<button>`.
12. **Structure ≠ looks.** `Heading` takes a required `level` (the tag) and an optional `size`
    (the look). Pick the level from the page outline, never from the visual size.

13. **Styling exception: runtime geometry via CSS variables only.** Values that exist only
    at runtime (column widths, virtual row offsets) are passed as CSS custom properties
    and read by Tailwind classes: `style={{ '--w': '120px' }}` + `className="w-(--w)"`.
    Never put real CSS properties in `style`. (Approved by Ben, 2026-10-03, for DataGrid.)

14. **Inverse surfaces with `data-inverse`, not new colours.** A bar that must stand out
    (bulk actions, unsaved changes) gets `data-inverse`: it takes the opposite theme's
    tokens, so put `bg-bg text-fg` on it and use normal components inside. A
    `<Button intent="secondary">` re-themes itself with no code change. Don't use `dark:`
    utilities inside an inverse; they follow `<html>`, not the inverse.

15. **Slots vs render props.** Static extra content is a `ReactNode` slot
    (`toolbarActions`). Content that depends on the component's state is a function
    (`renderBulkActions({ selectedRowIds, clearSelection })`): the component calls it with
    the data the caller needs.

16. **Primitives don't hide inside composites.** If a composite needs a control another
    screen would also need (DataGrid's checkbox), build the primitive (`Checkbox`) with
    its own test and story, and use it from the composite.

17. **Wrapping a headless component (React Aria).** Our component owns the public API;
    React Aria is an implementation detail apps never import.
    - Props are ours and plain: `options`, `value: string | null`, `onChange(value)`,
      `invalid`, `disabled`, `size`. Convert at the boundary (React Aria's "keys" →
      our strings; `invalid` → `isInvalid`).
    - Style state from React Aria's `data-*` attributes (`data-focused`,
      `data-selected`, `data-disabled`, `group-data-invalid:`), not from render props,
      unless the *content* changes (a check icon for the selected option).
    - React Aria positions popovers itself (it sets `top`/`left`); we size them with its
      CSS variables, e.g. `w-(--trigger-width)`. Our code stays Tailwind-only.
    - Field wiring: `aria-labelledby` = the Field's `labelId` for controls `htmlFor`
      can't name; `aria-describedby` merges the Field's ids with the caller's.

## Tests to write for every component

- renders the right element and role
- query by role and accessible name: `getByRole('textbox', { name: 'Email' })`. It computes the
  name the way a screen reader does (skips `aria-hidden`), unlike `getByLabelText`
- the default that prevents a footgun (e.g. `type="button"`)
- each state blocks or allows interaction as intended
- `className` override wins over the component's own class
- native attributes pass through; `ref` reaches the DOM node

- React Aria components: jsdom has no `CSS.escape` (polyfill it in the spec); focus is
  restored to the trigger on the next animation frame, so await one before asserting;
  focus the trigger first, as a keyboard user would
- virtualized components: jsdom has no layout, so mock `offsetHeight`/`offsetWidth` and
  assert rows actually rendered before asserting their order (an empty list "passes"
  any sort check)

## Stories to write

- `Playground` with controls
- one story per variant axis (`Intents`, `Sizes`)
- `States`
- anything keyboard-related gets its own story with a one-line instruction
