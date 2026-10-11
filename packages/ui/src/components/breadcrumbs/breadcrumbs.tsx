import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  Link as AriaLink,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

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
  className?: string;
};

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
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Invoices', href: '/invoices' },
 *   { label: 'INV-2041' },
 * ]} />
 */
export function Breadcrumbs({
  items,
  'aria-label': ariaLabel = 'Breadcrumbs',
  className,
}: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel} className={className}>
      <AriaBreadcrumbs className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, i) => (
          // React Aria marks the last Breadcrumb as current (data-current), and its Link
          // gets aria-current="page" and stops being clickable.
          <AriaBreadcrumb
            key={`${i}-${item.label}`}
            className="group flex items-center gap-1"
          >
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
        ))}
      </AriaBreadcrumbs>
    </nav>
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
