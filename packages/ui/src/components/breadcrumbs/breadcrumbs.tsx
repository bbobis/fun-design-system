import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  Link as AriaLink,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Menu, MenuItem } from '../menu';

export type BreadcrumbItem = {
  /** What the link says ("Invoices"). */
  label: string;
  /** Where it goes. Not needed for the last item (the current page). */
  href?: string;
};

export type BreadcrumbsProps = {
  /**
   * The trail from the top down to the current page. The **last** item is the current
   * page: it's marked `aria-current="page"` and isn't a link.
   */
  items: BreadcrumbItem[];
  /**
   * Names the `<nav>` landmark. Change it only if a page has two breadcrumb trails.
   * @default 'Breadcrumbs'
   */
  'aria-label'?: string;
  /**
   * The most levels to show. A longer trail shows the first item, a "…" menu with the
   * hidden levels, and the last `maxItems - 1` items. Leave it out to always show all.
   * Minimum 2.
   */
  maxItems?: number;
  className?: string;
};

/** Splits a trail into what's shown and what's hidden behind "…". */
export function collapseItems(items: BreadcrumbItem[], maxItems?: number) {
  if (maxItems === undefined || items.length <= maxItems) {
    return { before: items, hidden: [], after: [] };
  }
  const keepEnd = Math.max(maxItems, 2) - 1;
  return {
    before: items.slice(0, 1),
    hidden: items.slice(1, items.length - keepEnd),
    after: items.slice(items.length - keepEnd),
  };
}

/**
 * Shows where the current page sits in the app ("Invoices › INV-2041 › Edit"), with a
 * link back to each level above it.
 *
 * Built on React Aria `Breadcrumbs` + `Link`, inside a `<nav>` landmark so screen
 * reader users can jump to it. The separators are hidden from screen readers; the list
 * itself says how many levels there are.
 *
 * Links are plain `href`s. With a client-side router (React Router, Next.js), wrap the
 * app in React Aria's `RouterProvider` once and these links navigate without a reload.
 *
 * Long trails: `maxItems` puts the middle levels behind a "…" menu, so the trail stays
 * on one line and every level is still one click (or Enter) away.
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Invoices', href: '/invoices' },
 *   { label: 'INV-2041' },
 * ]} />
 */
export function Breadcrumbs({
  items,
  'aria-label': ariaLabel = 'Breadcrumbs',
  maxItems,
  className,
}: BreadcrumbsProps) {
  const { before, hidden, after } = collapseItems(items, maxItems);
  return (
    <nav aria-label={ariaLabel} className={className}>
      <AriaBreadcrumbs className="flex flex-wrap items-center gap-1 text-sm">
        {before.map((item, i) => (
          <Crumb key={`b${i}-${item.label}`} item={item} />
        ))}
        {hidden.length > 0 && (
          <AriaBreadcrumb className="flex items-center gap-1">
            {/* A menu, not an inline expand: the trail keeps its one line, and each
                hidden level is still a real link. */}
            <Menu
              label="…"
              aria-label={`Show ${hidden.length} more levels`}
              chevron={false}
              intent="ghost"
              size="sm"
              className="h-6 px-1.5 text-fg-muted"
            >
              {hidden.map((item, i) => (
                <MenuItem key={i} id={String(i)} href={item.href}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
            <ChevronIcon className="size-3.5 text-fg-muted" />
          </AriaBreadcrumb>
        )}
        {after.map((item, i) => (
          <Crumb key={`a${i}-${item.label}`} item={item} />
        ))}
      </AriaBreadcrumbs>
    </nav>
  );
}

function Crumb({ item }: { item: BreadcrumbItem }) {
  return (
    // React Aria marks the last Breadcrumb as current (data-current), and its Link
    // gets aria-current="page" and stops being clickable.
    <AriaBreadcrumb className="group flex items-center gap-1">
      <AriaLink
        href={item.href}
        className={cn(
          'rounded px-0.5 text-fg-muted underline-offset-4 outline-hidden',
          'hover:text-fg hover:underline',
          'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
          // The current page: normal text, not a link.
          'group-data-current:font-medium group-data-current:text-fg group-data-current:no-underline',
        )}
      >
        {item.label}
      </AriaLink>
      <ChevronIcon className="size-3.5 text-fg-muted group-data-current:hidden" />
    </AriaBreadcrumb>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Points the other way in right-to-left languages.
      className={cn('rtl:-scale-x-100', className)}
    >
      <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
  );
}
