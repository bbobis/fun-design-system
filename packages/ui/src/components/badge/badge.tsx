import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
    'text-xs font-medium whitespace-nowrap',
  ],
  {
    variants: {
      tone: {
        // The soft tokens: light fill + dark text in light mode, the reverse in dark.
        neutral: 'border-border bg-surface text-fg',
        info: 'border-transparent bg-info-soft text-on-info-soft',
        success: 'border-transparent bg-success-soft text-on-success-soft',
        warning: 'border-transparent bg-warning-soft text-on-warning-soft',
        danger: 'border-transparent bg-danger-soft text-on-danger-soft',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>;

/**
 * A short status label, like "Paid" or "Overdue" in a table cell.
 *
 * The text carries the meaning; the color only reinforces it. Never use a Badge with
 * color alone (no text), since some users can't tell the tones apart.
 * Not interactive: for something clickable, use a Button.
 */
export function Badge({ tone, className, ...rest }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...rest} />;
}
