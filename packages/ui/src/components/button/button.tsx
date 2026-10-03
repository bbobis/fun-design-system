import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

/**
 * Style recipe. Every class here uses a semantic token (bg-primary, text-fg),
 * never a raw color, so the Button follows the theme on its own.
 */
const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap',
    'transition-colors select-none',
    // Keyboard focus only; mouse clicks don't show the ring. No `outline-none` here:
    // in Tailwind v4 it sets --tw-outline-style:none, which focus-visible:outline-2 then inherits.
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    // Both native disabled and aria-disabled (used while loading) look the same.
    'disabled:cursor-not-allowed disabled:opacity-50',
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
  ],
  {
    variants: {
      intent: {
        primary: 'bg-primary text-on-primary hover:bg-primary-hover',
        secondary: 'bg-secondary text-on-secondary hover:bg-secondary-hover',
        ghost: 'bg-transparent text-fg hover:bg-surface',
        danger: 'bg-danger text-on-danger hover:bg-danger-hover',
      },
      size: {
        sm: 'h-8 gap-1.5 px-3 text-sm',
        md: 'h-10 gap-2 px-4 text-sm',
        lg: 'h-12 gap-2 px-6 text-base',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Shows a spinner and blocks clicks, but keeps the button focusable so keyboard
     * users don't lose their place. Sets `aria-busy` for screen readers.
     * @default false
     */
    loading?: boolean;
  };

/**
 * The one main action on a screen is `primary`; everything else is `secondary` or `ghost`.
 * `danger` is only for destructive actions. Renders a native `<button>`, so Enter and
 * Space work without any extra code.
 */
export function Button({
  intent,
  size,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const blocked = disabled || loading;

  return (
    <button
      // Native `disabled` for a real disabled button. While loading we use aria-disabled
      // instead, so the button stays in the tab order and focus doesn't jump away.
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      type={type}
      className={cn(buttonVariants({ intent, size }), className)}
      onClick={blocked ? undefined : onClick}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
}
