import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Heading, type HeadingLevel } from '../heading';

const emptyStateVariants = cva(
  'mx-auto flex max-w-md flex-col items-center text-center',
  {
    variants: {
      size: {
        /** Inside a table, a card or a panel. */
        compact: 'gap-1.5 py-6',
        /** A whole page or section with nothing in it yet. */
        default: 'gap-2 py-12',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

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
  className,
}: EmptyStateProps) {
  const compact = size === 'compact';
  return (
    <div className={cn(emptyStateVariants({ size }), className)}>
      {icon && (
        <div
          aria-hidden="true"
          className={cn(
            'mb-1 flex items-center justify-center rounded-full bg-surface text-fg-muted',
            compact ? 'size-10 [&_svg]:size-5' : 'size-14 [&_svg]:size-7',
          )}
        >
          {icon}
        </div>
      )}
      <Heading level={headingLevel} size={compact ? 'xs' : 'sm'}>
        {title}
      </Heading>
      {description && (
        <p className="text-sm text-balance text-fg-muted">{description}</p>
      )}
      {action && <div className={cn(compact ? 'mt-2' : 'mt-3')}>{action}</div>}
    </div>
  );
}
