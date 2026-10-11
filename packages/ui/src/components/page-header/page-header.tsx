import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Heading } from '../heading';

export type PageHeaderProps = {
  /** The page's title. Rendered as its `h1`: one per page. */
  title: string;
  /** One sentence under the title. */
  description?: ReactNode;
  /** Shown above the title, usually `<Breadcrumbs />`. */
  breadcrumbs?: ReactNode;
  /** Buttons on the right ("New invoice"). They wrap under the title on narrow screens. */
  actions?: ReactNode;
  className?: string;
};

/**
 * The top of a page: where you are (breadcrumbs), what it is (title + description), and
 * what you can do (actions). Gives every page the same shape and exactly one `h1`.
 *
 * @example
 * <PageHeader
 *   breadcrumbs={<Breadcrumbs items={[{ label: 'Billing', href: '/billing' }, { label: 'Invoices' }]} />}
 *   title="Invoices"
 *   description="All invoices sent in the last 12 months."
 *   actions={<Button>New invoice</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-2', className)}>
      {breadcrumbs}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Heading level={1} size="xl">
            {title}
          </Heading>
          {description && (
            <p className="max-w-prose text-sm text-fg-muted">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
