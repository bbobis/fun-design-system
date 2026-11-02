import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Heading, type HeadingLevel } from '../heading';

const emptyStateVariants = cva('flex flex-col', {
  variants: {
    size: {
      /** Inside a table, a card or a panel. */
      compact: 'gap-1.5 py-6',
      /** A section with nothing in it yet. */
      default: 'gap-2 py-12',
      /** A whole page with nothing in it yet (a new account). */
      large: 'gap-3 py-20',
    },
    /**
     * `plain`: no box. `bordered`: a dashed box ("add your first…" areas).
     * `card`: a soft panel. The boxes get side padding; plain doesn't need it.
     */
    variant: {
      plain: '',
      bordered: 'rounded-lg border-2 border-dashed border-border px-6',
      card: 'rounded-lg bg-surface px-6',
    },
    align: {
      center: 'mx-auto max-w-md items-center text-center',
      // In a side panel or a form section, where everything else is left-aligned.
      start: 'items-start text-start',
    },
  },
  compoundVariants: [
    // A box fills the space it's given (a grid cell, a card); only the plain,
    // boxless version keeps the narrow centered column.
    {
      variant: ['bordered', 'card'],
      align: 'center',
      className: 'w-full max-w-none',
    },
  ],
  defaultVariants: { size: 'default', variant: 'plain', align: 'center' },
});

/** The icon circle's colors. Same soft color pairs as Alert and Badge. */
const toneCircle = {
  neutral: 'bg-surface text-fg-muted',
  info: 'bg-info-soft text-on-info-soft',
  success: 'bg-success-soft text-on-success-soft',
  warning: 'bg-warning-soft text-on-warning-soft',
  danger: 'bg-danger-soft text-on-danger-soft',
} as const;

const iconSize = {
  compact: 'size-10 [&_svg]:size-5',
  default: 'size-14 [&_svg]:size-7',
  large: 'size-20 [&_svg]:size-10',
} as const;

export type EmptyStateProps = VariantProps<typeof emptyStateVariants> & {
  /** What's missing, plainly: "No invoices yet", "No results for “acme”". */
  title: string;
  /**
   * The heading level in the page outline (2–6). Required on purpose, like Heading:
   * only you know where this sits in the page.
   */
  headingLevel: Exclude<HeadingLevel, 1>;
  /** Why it's empty and what to do about it, in one or two sentences. */
  description?: ReactNode;
  /** A decorative icon or illustration. Hidden from screen readers. */
  icon?: ReactNode;
  /** The way forward: usually one Button ("Create invoice", "Clear filters"). */
  action?: ReactNode;
  /**
   * Colors the icon circle: `danger` for "Couldn't load invoices", `success` for
   * "All caught up". The title must still say it: color is extra.
   * @default 'neutral'
   */
  tone?: keyof typeof toneCircle;
  className?: string;
};

/**
 * What to show when there's nothing to show: a new account with no data, a search
 * with no results, a filter that hides everything. Say what's missing and offer the
 * next step; never leave a blank area.
 *
 * Use different words for the two cases people hit most: *no data yet* ("Create your
 * first invoice") and *no results* ("Try fewer filters"). They need different actions.
 */
export function EmptyState({
  title,
  headingLevel,
  description,
  icon,
  action,
  size,
  variant,
  align,
  tone = 'neutral',
  className,
}: EmptyStateProps) {
  const s = size ?? 'default';
  return (
    <div
      className={cn(emptyStateVariants({ size, variant, align }), className)}
    >
      {icon && (
        <div
          aria-hidden="true"
          data-tone={tone}
          className={cn(
            'mb-1 flex items-center justify-center rounded-full',
            toneCircle[tone],
            iconSize[s],
            // On the gray card, a neutral circle would vanish: give it the page color.
            variant === 'card' && tone === 'neutral' && 'bg-bg',
          )}
        >
          {icon}
        </div>
      )}
      <Heading
        level={headingLevel}
        size={s === 'compact' ? 'xs' : s === 'large' ? 'md' : 'sm'}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            // max-w-md keeps lines readable when a box is wide.
            'max-w-md text-balance text-fg-muted',
            s === 'large' ? 'text-base' : 'text-sm',
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className={cn(s === 'compact' ? 'mt-2' : 'mt-3')}>{action}</div>
      )}
    </div>
  );
}
