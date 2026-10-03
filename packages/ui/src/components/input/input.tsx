import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import { useFieldContext } from '../field/field-context';

const inputVariants = cva(
  [
    'w-full min-w-0 rounded-md border border-border-strong bg-bg text-fg',
    'placeholder:text-fg-muted',
    'transition-colors',
    // Same keyboard focus ring as Button. No `outline-none` (see component-recipe.md).
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    // Error state is driven by the ARIA attribute, so styling and accessibility can't disagree.
    'aria-invalid:border-danger',
    'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
  ],
  {
    variants: {
      // Heights match Button sizes, so an Input and a Button line up in a row.
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type InputProps = Omit<ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants> & {
    /**
     * Marks the input invalid (`aria-invalid`) and shows the error border.
     * Inside a `Field`, this is set for you when the Field has an `error`.
     * @default false
     */
    invalid?: boolean;
  };

/**
 * A native `<input>`. Use it inside `Field` to get a label, help text and error
 * message wired up. On its own, give it an accessible name (`aria-label`, or a
 * `<Label htmlFor>` pointing at its `id`).
 */
export function Input({
  size,
  invalid,
  id,
  required,
  disabled,
  className,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: InputProps) {
  const field = useFieldContext();

  // Explicit props win over the Field's values, so an app can still override.
  const isInvalid = invalid ?? field?.invalid ?? false;
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;

  return (
    <input
      id={id ?? field?.controlId}
      required={required ?? field?.required}
      disabled={disabled ?? field?.disabled}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
      className={cn(inputVariants({ size }), className)}
      {...rest}
    />
  );
}
