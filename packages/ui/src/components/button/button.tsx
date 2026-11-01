import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../utils/cn';

/**
 * Style recipe. Every class here uses a semantic token (bg-primary, text-fg),
 * never a raw color, so the Button follows the theme on its own.
 *
 * Exported for our own components whose trigger must be a React Aria Button (Menu):
 * they look exactly like a Button without wrapping it. Not exported from the package.
 */
export const buttonVariants = cva(
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
        // Between secondary (filled) and ghost (nothing): a visible edge, no fill.
        outline:
          'border border-border-strong bg-transparent text-fg hover:bg-surface',
        ghost: 'bg-transparent text-fg hover:bg-surface',
        danger: 'bg-danger text-on-danger hover:bg-danger-hover',
      },
      size: {
        sm: 'h-8 gap-1.5 px-3 text-sm',
        md: 'h-10 gap-2 px-4 text-sm',
        lg: 'h-12 gap-2 px-6 text-base',
      },
      shape: {
        default: '',
        pill: 'rounded-full',
        // Icon-only: as wide as it is tall, no side padding.
        square: 'px-0',
      },
      fullWidth: { true: 'w-full', false: '' },
    },
    compoundVariants: [
      { shape: 'square', size: 'sm', className: 'w-8' },
      { shape: 'square', size: 'md', className: 'w-10' },
      { shape: 'square', size: 'lg', className: 'w-12' },
    ],
    defaultVariants: {
      intent: 'primary',
      size: 'md',
      shape: 'default',
      fullWidth: false,
    },
  },
);

type ButtonBaseProps = ComponentProps<'button'> &
  Omit<VariantProps<typeof buttonVariants>, 'shape' | 'fullWidth'> & {
    /**
     * Shows a spinner and blocks clicks, but keeps the button focusable so keyboard
     * users don't lose their place. Sets `aria-busy` for screen readers. The spinner
     * takes `startIcon`'s place, so the label doesn't move.
     * @default false
     */
    loading?: boolean;
    /** Stretch to the container's width (mobile forms, dialog footers). @default false */
    fullWidth?: boolean;
    /** An icon before the label. Decoration: hidden from screen readers. */
    startIcon?: ReactNode;
    /** An icon after the label ("Next →", a dropdown ▾). Decoration. */
    endIcon?: ReactNode;
  };

/**
 * A *discriminated union*: the value of `shape` decides which props are allowed.
 * - `default` / `pill`: the label is the visible text.
 * - `square`: icon only, so there is no visible text, and `aria-label` is **required**
 *   (the type won't compile without it).
 */
export type ButtonProps =
  | (ButtonBaseProps & {
      /** `default` (rounded corners), `pill` (fully round), or `square` (icon only). @default 'default' */
      shape?: 'default' | 'pill';
    })
  | (ButtonBaseProps & {
      shape: 'square';
      /** Required for an icon-only button: it's the button's only name ("Delete invoice"). */
      'aria-label': string;
    });

/**
 * The one main action on a screen is `primary`; everything else is `secondary` or `ghost`.
 * `danger` is only for destructive actions. Renders a native `<button>`, so Enter and
 * Space work without any extra code.
 */
const iconSize = {
  sm: 'size-4 shrink-0',
  md: 'size-4 shrink-0',
  lg: 'size-5 shrink-0',
} as const;

export function Button({
  intent,
  size,
  shape,
  fullWidth,
  startIcon,
  endIcon,
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
      className={cn(
        buttonVariants({ intent, size, shape, fullWidth }),
        className,
      )}
      onClick={blocked ? undefined : onClick}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        startIcon && (
          <span aria-hidden="true" className={iconSize[size ?? 'md']}>
            {startIcon}
          </span>
        )
      )}
      {children}
      {endIcon && (
        <span aria-hidden="true" className={iconSize[size ?? 'md']}>
          {endIcon}
        </span>
      )}
    </button>
  );
}
