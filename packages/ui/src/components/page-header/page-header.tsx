import type { ReactNode, SVGProps } from 'react';
import { Link as AriaLink } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Heading, type HeadingSize } from '../heading';

/** A section link under the header (Overview / Activity / Settings). */
export type PageHeaderNavItem = {
  label: string;
  href: string;
  /** The section on screen: underlined, and `aria-current="page"`. */
  current?: boolean;
  /** A small count after the label ("Activity 12"). */
  count?: number;
};

export type PageHeaderProps = {
  /** The page's title. Rendered as its `h1`: one per page. */
  title: string;
  /** One sentence under the title. */
  description?: ReactNode;
  /** Shown above the title, usually `<Breadcrumbs />`. */
  breadcrumbs?: ReactNode;
  /** Buttons on the right ("New invoice"). They wrap under the title on narrow screens. */
  actions?: ReactNode;
  /**
   * A link back to the parent list, above the title, for detail pages ("← Invoices").
   * Screen readers hear "Back to Invoices". Use it *or* breadcrumbs, not both.
   */
  back?: { href: string; label: string };
  /**
   * Small facts in a row under the title: a status Badge, "Created Oct 2",
   * "Owner: Ben". Not a place for actions.
   */
  meta?: ReactNode;
  /**
   * Section links under the header, styled like underline tabs. They're links in a
   * `<nav>` (named "<title> sections"), not a Tabs widget: each one goes to its own
   * URL. Use Tabs only for panels that switch without leaving the page.
   */
  nav?: readonly PageHeaderNavItem[];
  /**
   * `sm` for dense admin screens, `md` for most pages, `lg` for a landing page.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /** A line under the header (under the nav, when there is one). @default false */
  divided?: boolean;
  className?: string;
};

const sizes: Record<
  NonNullable<PageHeaderProps['size']>,
  { title: HeadingSize; gap: string; margin: string; description: string }
> = {
  sm: { title: 'lg', gap: 'gap-1.5', margin: 'mb-4', description: 'text-sm' },
  md: { title: 'xl', gap: 'gap-2', margin: 'mb-6', description: 'text-sm' },
  lg: { title: '2xl', gap: 'gap-3', margin: 'mb-8', description: 'text-base' },
};

/**
 * The top of a page: where you are (breadcrumbs or a back link), what it is (title,
 * description, facts), what you can do (actions), and its sections (nav). Gives every
 * page the same shape and exactly one `h1`.
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
  back,
  meta,
  nav,
  size = 'md',
  divided = false,
  className,
}: PageHeaderProps) {
  const s = sizes[size];
  const navItems = nav ?? [];
  const hasNav = navItems.length > 0;
  return (
    <div
      className={cn(
        'flex flex-col',
        s.gap,
        s.margin,
        // With a nav, the line sits under the links (their underline sits on it).
        divided && 'border-b border-border',
        divided && !hasNav && (size === 'sm' ? 'pb-3' : 'pb-5'),
        className,
      )}
    >
      {breadcrumbs}
      {back && (
        <AriaLink
          href={back.href}
          // The arrow is drawn; "Back to" is said. The name still contains the
          // visible words ("Invoices"), so voice users can say what they see
          // (WCAG 2.5.3, label in name).
          aria-label={`Back to ${back.label}`}
          className={cn(
            'inline-flex items-center gap-1 self-start rounded-sm text-sm font-medium text-fg-muted outline-hidden',
            'data-hovered:text-fg',
            'data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
          )}
        >
          <ArrowIcon className="size-4 rtl:-scale-x-100" />
          {back.label}
        </AriaLink>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Heading level={1} size={s.title}>
            {title}
          </Heading>
          {description && (
            <p className={cn('max-w-prose text-fg-muted', s.description)}>
              {description}
            </p>
          )}
          {meta && (
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
              {meta}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {hasNav && (
        <nav aria-label={`${title} sections`} className="-mb-px mt-2">
          <ul className="flex gap-4 overflow-x-auto">
            {navItems.map((item) => (
              <li key={item.href}>
                <AriaLink
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={cn(
                    // Underline-tab look: the current one gets a 2px line (and bold
                    // text, so it isn't shown by color alone).
                    'inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-2 text-sm whitespace-nowrap text-fg-muted outline-hidden',
                    'data-hovered:text-fg',
                    'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
                    item.current && 'border-primary font-medium text-fg',
                  )}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span className="rounded-full bg-surface px-1.5 text-xs text-fg-muted tabular-nums">
                      {item.count}
                    </span>
                  )}
                </AriaLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M13 8H3m4-4L3 8l4 4" />
    </svg>
  );
}
