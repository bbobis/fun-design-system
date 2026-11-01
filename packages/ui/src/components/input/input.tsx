import { cva, type VariantProps } from 'class-variance-authority';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useFieldContext } from '../field/field-context';

/** The box: border, fill, focus ring, error and disabled looks. */
const boxVariants = cva(
  ['w-full min-w-0 rounded-md text-fg', 'transition-colors'],
  {
    variants: {
      variant: {
        outline: 'border border-border-strong bg-bg',
        // A grey fill alone is too close to the page (≈1.1:1), and an input's edge
        // must reach 3:1 (WCAG 1.4.11). So it keeps a strong *bottom* line, like
        // Material's filled field: quiet, but still clearly a field.
        filled:
          'rounded-b-none border border-transparent border-b-border-strong bg-surface hover:bg-border/40',
      },
      // Heights match Button sizes, so an Input and a Button line up in a row.
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

const pad = { sm: 'px-2.5', md: 'px-3', lg: 'px-4' } as const;
const gap = { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-2.5' } as const;

/** States, on the element that has the border (the input, or the wrapper). */
const ownStates = [
  'placeholder:text-fg-muted',
  // Same keyboard focus ring as Button. No `outline-none` (see component-recipe.md).
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
  // Error state is driven by the ARIA attribute, so styling and accessibility can't disagree.
  'aria-invalid:border-danger',
  'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
];
const wrapperStates = [
  'flex items-center',
  // The ring and states belong to the box, but the input is what has them.
  'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-focus-ring',
  'has-[input[aria-invalid]]:border-danger',
  'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-surface has-[input:disabled]:opacity-60',
];

export type InputProps = Omit<ComponentProps<'input'>, 'size'> &
  VariantProps<typeof boxVariants> & {
    /**
     * Marks the input invalid (`aria-invalid`) and shows the error border.
     * Inside a `Field`, this is set for you when the Field has an `error`.
     * @default false
     */
    invalid?: boolean;
    /**
     * Inside the box, before the text. Text (`"$"`) is read with the field through
     * `aria-describedby`. An element (an icon) is shown as is: give icons
     * `aria-hidden`. With an adornment, `className` styles the box, not the input.
     */
    startAdornment?: ReactNode;
    /**
     * Inside the box, after the text: a unit (`"kg"`, read with the field), an icon,
     * or a small button (show password, clear). Buttons stay real buttons.
     */
    endAdornment?: ReactNode;
  };

/**
 * A native `<input>`. Use it inside `Field` to get a label, help text and error
 * message wired up. On its own, give it an accessible name (`aria-label`, or a
 * `<Label htmlFor>` pointing at its `id`).
 *
 * `variant`: `outline` (default) or `filled` (grey fill with a strong bottom line, for
 * dense forms).
 */
export function Input({
  size,
  variant,
  invalid,
  id,
  required,
  disabled,
  startAdornment,
  endAdornment,
  className,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: InputProps) {
  const field = useFieldContext();
  const ids = useId();
  const s = size ?? 'md';

  // Text adornments ("$", "kg") carry meaning, so the input points at them.
  const isText = (a: ReactNode) =>
    typeof a === 'string' || typeof a === 'number';
  const startId = isText(startAdornment) ? `${ids}-start` : undefined;
  const endId = isText(endAdornment) ? `${ids}-end` : undefined;

  // Explicit props win over the Field's values, so an app can still override.
  const isInvalid = invalid ?? field?.invalid ?? false;
  const describedBy =
    [field?.describedBy, ariaDescribedBy, startId, endId]
      .filter(Boolean)
      .join(' ') || undefined;

  const inputProps = {
    id: id ?? field?.controlId,
    required: required ?? field?.required,
    disabled: disabled ?? field?.disabled,
    'aria-invalid': isInvalid || undefined,
    'aria-describedby': describedBy,
    ...rest,
  };

  if (startAdornment === undefined && endAdornment === undefined) {
    return (
      <input
        {...inputProps}
        className={cn(
          boxVariants({ variant, size }),
          pad[s],
          ownStates,
          className,
        )}
      />
    );
  }

  const adornment = (content: ReactNode, textId: string | undefined) => (
    <span
      id={textId}
      className="flex shrink-0 items-center text-fg-muted [&_svg]:size-4"
    >
      {content}
    </span>
  );

  return (
    // Not a <label>: an end adornment can be a button, and a button inside a label
    // is a mess. Instead a press on the box (not on a control) focuses the input.
    <div
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('input, button, a, [role=button]')) return;
        e.preventDefault(); // keep the focus move from being undone
        e.currentTarget.querySelector('input')?.focus();
      }}
      className={cn(
        boxVariants({ variant, size }),
        pad[s],
        gap[s],
        wrapperStates,
        'cursor-text',
        className,
      )}
    >
      {startAdornment !== undefined && adornment(startAdornment, startId)}
      <input
        {...inputProps}
        className="h-full min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-fg-muted disabled:cursor-not-allowed"
      />
      {endAdornment !== undefined && adornment(endAdornment, endId)}
    </div>
  );
}
