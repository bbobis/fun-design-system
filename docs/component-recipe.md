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

13. **Styling exception: runtime geometry via CSS variables only** (`utils/css-vars.ts`). Values that exist only
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
    - Control the *value*, not the internal mechanics. Combobox controls the selected
      key but leaves the input text to React Aria: controlled text switches off its
      "show the picked label / reset on blur" logic. Apps listen with `onInputChange`.
    - Inside a React Aria `ComboBox`/`Select`, anything that is itself a collection
      (TagGroup, a second ListBox) must sit in a *hideable* wrapper such as
      `ComboBoxValue`. React Aria builds the option list by rendering the children in a
      hidden pass; a bare TagGroup gets rendered there too and crashes.
    - The field box is React Aria's `Group`: the dropdown then anchors to, and is as
      wide as, the whole box (not just the text input).
    - Dates cross our API as ISO day strings (`'2026-10-04'`), never JS `Date` or
      React Aria's `CalendarDate`. A `Date` is a moment, so it can be a different day in
      another time zone; a string is a calendar day and survives JSON and forms as is.
      Convert to `CalendarDate` only inside the component (`parseDate`).
18. **Popups inside a composite (grid cell editors).** When a React Aria popup lives
    inside a component that has its own keyboard model (the DataGrid):
    - Read the value from a **handle** (`getValue()`), never from an input's DOM text.
      A combobox input holds the search text; the value is the picked option.
    - Route the composite's keys in the **capture phase** (`onKeyDownCapture`). React
      Aria stops Enter from bubbling, so a bubble-phase listener would never see it.
      While the popup is open, the library owns the keys; we only stop them reaching
      the composite twice.
    - React events bubble through **portals** (the React tree, not the DOM). A click in
      a portaled list reaches the cell's `onMouseDown`; check
      `event.currentTarget.contains(event.target)` before acting. The same fact lets
      `onFocus` on a wrapper see focus moving into its popup ("still inside").
19. **Modal overlays (Dialog, AlertDialog).** Controlled only: `open` + `onOpenChange`,
    opened from any Button's `onClick`. Our Button is a native `<button>`, and React
    Aria's `DialogTrigger` only listens to its own Button, so a trigger wrapper would
    force two Button components on apps.
    - `title` is a required string: it is the dialog's accessible name.
    - React Aria makes the page behind inert and returns focus to the opener on close;
      don't re-implement either. It names the dialog from `slot="title"` but not the
      description: wire `aria-describedby` yourself.
    - A question (`AlertDialog`) never closes on an outside click, and focus starts on
      the safe button (Cancel).
20. **Triggers React Aria must own (Menu).** When the trigger *is* part of the pattern
    (a menu button needs `aria-expanded` and ↓-to-open), our component renders the
    trigger itself, as a React Aria `Button` styled with `buttonVariants`. Apps pass
    `label` / `intent` / `size`, never a button element. (A Dialog is different: any
    button can open it, so it stays controlled; see rule 19.)
    - Our list props are plain strings: `selectedKeys: string[]`, not React Aria's
      `Set<Key>`. Convert at the boundary.
    - The trigger is one internal component, `button/trigger-button.tsx`, shared by
      Menu and Popover. Their props extend `TriggerButtonProps`.
    - Content that must close its own popup (an Apply button) gets `close` from
      children-as-a-function: `{({ close }) => …}`. No ref, no extra state.
21. **Behavior that attaches to *your* element (Tooltip).** When an overlay doesn't
    own its trigger, wrap the app's element with React Aria's `Focusable` (re-exported
    by `react-aria-components`) instead of changing our Button. The child only has to
    pass props and `ref` to a DOM element.
    - A tooltip is a description (`aria-describedby`), never the name: icon-only
      buttons keep their own `aria-label`. It never shows on touch, so nothing a user
      needs may live only in a tooltip.
22. **Unstable headless APIs (Toast).** When React Aria marks something `UNSTABLE_`,
    only one file of ours may import it, our public API must not mention it (apps use
    `toast.success()` and `<ToastRegion />`), and `react-aria-components` stays pinned
    to patch updates (`~`). An upgrade is a PR whose tests prove the wrapper still works.
23. **Group controls carry their own label (RadioGroup, CheckboxGroup).** A
    group is named by a legend-like label over all its choices, not by `<label for>`
    on one control, so it can't sit inside `Field`. It takes the *same* prop names as
    Field (`label`, `description`, `error`, `required`, `disabled`), so the API feels
    the same.
24. **`isInvalid`: `false` switches React Aria's own checks off.** React Aria shows our
    `isInvalid` if it's set, and its *built-in* checks only if it's `undefined`
    (`useFormValidationState`). So pick per component:
    - It has checks users need (DatePicker/DateRangePicker: a typed day outside
      `min`/`max`, an end before the start) → `isInvalid={invalid || field?.invalid || undefined}`.
    - Its only built-in check is `required` (Select, Combobox, MultiCombobox,
      RadioGroup, CheckboxGroup) or it clamps instead (NumberField) → `?? false` is
      right: the app owns required messages (it passes `error`), so React Aria's default
      "Please select an item" never shows.
    Audited 2026-10-12: only the date pickers needed `undefined`.
25. **The ARIA role decides where Tab lands.** A `radiogroup`, a selectable `grid`
    (TagGroup), `tablist` and a calendar all promise that Tab lands on the *chosen*
    item, not the first. React Aria does this for Tabs, TagGroup, Select, Calendar,
    but not for `ToggleButtonGroup` (toolbar behaviour), which needs an
    `onFocusCapture` redirect (SegmentedControl). Check it in Chromium for every new
    composite: Tab in with the chosen item *not* first, and read `document.activeElement`.
    Audited 2026-10-12: only SegmentedControl needed a fix.

## Tests to write for every component

- renders the right element and role
- query by role and accessible name: `getByRole('textbox', { name: 'Email' })`. It computes the
  name the way a screen reader does (skips `aria-hidden`), unlike `getByLabelText`
- the default that prevents a footgun (e.g. `type="button"`)
- each state blocks or allows interaction as intended
- `className` override wins over the component's own class
- native attributes pass through; `ref` reaches the DOM node

- interactions: use `@testing-library/user-event` (`const user = userEvent.setup()`,
  then `await user.click(...)`, `await user.tab()`, `await user.keyboard('{ArrowRight}')`).
  It plays the whole sequence a browser would (pointer, mouse, focus, click, label →
  input), so it reaches React Aria's press handling where a bare `fireEvent.click` may
  not (CheckboxCard). Always `await` it. Keep `fireEvent` for one low-level event on
  purpose (`pointerDown` on a Dialog overlay). Existing specs move over when touched.
- jsdom gaps every real browser fills (e.g. `CSS.escape`, used by React Aria) go in
  `src/test-setup.ts`, which Vitest runs before every spec. Not in individual specs.
- React Aria components: focus is
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
