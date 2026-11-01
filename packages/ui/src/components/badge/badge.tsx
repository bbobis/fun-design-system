import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full border font-medium whitespace-nowrap',
  ],
  {
    variants: {
      /**
       * A tone only *names its colors*, as CSS variables. The variant below decides
       * which of them paint the fill, border and text. 5 tones + 3 variants = 8 small
       * entries, instead of 15 tone×variant combinations.
       */
      tone: {
        neutral:
          '[--badge-soft:var(--color-surface)] [--badge-on-soft:var(--color-fg)] [--badge-solid:var(--color-fg)] [--badge-on-solid:var(--color-bg)] [--badge-line:var(--color-border-strong)]',
        info: '[--badge-soft:var(--color-info-soft)] [--badge-on-soft:var(--color-on-info-soft)] [--badge-solid:var(--color-info)] [--badge-on-solid:var(--color-on-info)] [--badge-line:var(--color-info)]',
        success:
          '[--badge-soft:var(--color-success-soft)] [--badge-on-soft:var(--color-on-success-soft)] [--badge-solid:var(--color-success)] [--badge-on-solid:var(--color-on-success)] [--badge-line:var(--color-success)]',
        warning:
          '[--badge-soft:var(--color-warning-soft)] [--badge-on-soft:var(--color-on-warning-soft)] [--badge-solid:var(--color-warning)] [--badge-on-solid:var(--color-on-warning)] [--badge-line:var(--color-warning)]',
        danger:
          '[--badge-soft:var(--color-danger-soft)] [--badge-on-soft:var(--color-on-danger-soft)] [--badge-solid:var(--color-danger)] [--badge-on-solid:var(--color-on-danger)] [--badge-line:var(--color-danger)]',
      },
      variant: {
        // The soft tokens: light fill + dark text in light mode, the reverse in dark.
        soft: 'border-transparent bg-(--badge-soft) text-(--badge-on-soft)',
        // Strongest: for states that must stand out (Overdue, Failed).
        solid: 'border-transparent bg-(--badge-solid) text-(--badge-on-solid)',
        // Lightest: a coloured line, no fill. Good for dense tables. Text uses the
        // soft-text token, which is made to contrast with the page in both themes.
        outline: 'border-(--badge-line) bg-transparent text-(--badge-on-soft)',
      },
      size: {
        sm: 'gap-1 px-1.5 text-[0.6875rem] leading-4',
        md: 'gap-1 px-2 py-0.5 text-xs',
      },
    },
    compoundVariants: [
      // Neutral soft keeps today's hairline border, so it doesn't vanish on a surface.
      { tone: 'neutral', variant: 'soft', className: 'border-border' },
    ],
    defaultVariants: { tone: 'neutral', variant: 'soft', size: 'md' },
  },
);

export type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    /**
     * A small dot in the tone's strong color before the text ("● Online"). Decoration
     * only: the text still says the state. @default false
     */
    dot?: boolean;
    /** A small icon before the text. Decoration: hidden from screen readers. */
    icon?: ReactNode;
  };

/**
 * A short status label, like "Paid" or "Overdue" in a table cell.
 *
 * The text carries the meaning; the color, dot and icon only reinforce it. Never use a
 * Badge with color alone (no text), since some users can't tell the tones apart.
 * Not interactive: for something clickable, use a Button.
 *
 * `variant`: `soft` (default) for most states, `solid` for the one that must stand
 * out, `outline` where many badges sit close together.
 */
export function Badge({
  tone,
  variant,
  size,
  dot = false,
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  const solid = variant === 'solid';
  return (
    <span
      className={cn(badgeVariants({ tone, variant, size }), className)}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            // On a solid fill the dot uses the text color, or it would disappear.
            solid ? 'bg-current' : 'bg-(--badge-solid)',
          )}
        />
      )}
      {icon && (
        <span
          aria-hidden="true"
          className={cn('shrink-0', size === 'sm' ? 'size-3' : 'size-3.5')}
        >
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
