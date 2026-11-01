import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
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
  /** A small icon before the label (a house for "Home"). Decoration: hidden from screen readers. */
  icon?: ReactNode;
  /**
   * Show only the icon. The label is hidden on screen but stays the link's name, so
   * screen readers still say "Home". Needs `icon`.
   */
  iconOnly?: boolean;
};

export type BreadcrumbSeparator = 'chevron' | 'slash' | 'arrow';
export type BreadcrumbVariant = 'plain' | 'contained' | 'steps';
export type BreadcrumbSize = 'sm' | 'md';

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
  /** What sits between levels. Not used by `variant="steps"` (the shapes are the separator). @default 'chevron' */
  separator?: BreadcrumbSeparator;
  /**
   * - `plain`: just the links and separators.
   * - `contained`: the trail sits in a soft rounded bar.
   * - `steps`: each level is an arrow-shaped segment; the current page is filled.
   * @default 'plain'
   */
  variant?: BreadcrumbVariant;
  /** @default 'md' */
  size?: BreadcrumbSize;
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
 * app in our `RouterProvider` once and these links navigate without a reload.
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
  separator = 'chevron',
  variant = 'plain',
  size = 'md',
  className,
}: BreadcrumbsProps) {
  const { before, hidden, after } = collapseItems(items, maxItems);
  const look = { separator, variant, size };
  return (
    // isolate: the steps' painted shapes sit at z-index -1 inside this box, not
    // behind the whole page.
    <nav aria-label={ariaLabel} className={cn('isolate', className)}>
      <AriaBreadcrumbs className={listVariants({ variant, size })}>
        {before.map((item, i) => (
          <Crumb
            key={`b${i}-${item.label}`}
            item={item}
            first={i === 0}
            {...look}
          />
        ))}
        {hidden.length > 0 && (
          <AriaBreadcrumb className={crumbVariants({ variant, size })}>
            {variant === 'steps' && <StepShape first={false} />}
            {/* A menu, not an inline expand: the trail keeps its one line, and each
                hidden level is still a real link. */}
            <Menu
              label="…"
              aria-label={`Show ${hidden.length} more levels`}
              chevron={false}
              intent="ghost"
              size="sm"
              className={cn(
                'px-1.5 text-fg-muted',
                size === 'sm' ? 'h-5' : 'h-6',
              )}
            >
              {hidden.map((item, i) => (
                <MenuItem key={i} id={String(i)} href={item.href}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
            {variant !== 'steps' && <Separator kind={separator} size={size} />}
          </AriaBreadcrumb>
        )}
        {after.map((item, i) => (
          <Crumb
            key={`a${i}-${item.label}`}
            item={item}
            first={before.length === 0 && i === 0}
            {...look}
          />
        ))}
      </AriaBreadcrumbs>
    </nav>
  );
}

const listVariants = cva('flex flex-wrap items-center', {
  variants: {
    variant: {
      plain: 'gap-1',
      // The whole trail in one soft bar. w-fit: as wide as the trail, not the page.
      contained: 'w-fit gap-1 rounded-full bg-surface',
      // Segments touch; each one's arrow fits into the next one's notch.
      steps: 'gap-y-1',
    },
    size: { sm: 'text-xs', md: 'text-sm' },
  },
  compoundVariants: [
    { variant: 'contained', size: 'sm', className: 'px-2.5 py-1' },
    { variant: 'contained', size: 'md', className: 'px-3.5 py-1.5' },
  ],
  defaultVariants: { variant: 'plain', size: 'md' },
});

const crumbVariants = cva('group flex items-center', {
  variants: {
    variant: {
      plain: 'gap-1',
      contained: 'gap-1',
      // Room for the arrow (end) and notch (start) of the painted shape.
      steps:
        'relative -ms-1.5 ps-4 pe-4 first:ms-0 first:ps-3 data-current:text-on-primary',
    },
    size: { sm: '', md: '' },
  },
  compoundVariants: [
    { variant: 'steps', size: 'sm', className: 'h-7' },
    { variant: 'steps', size: 'md', className: 'h-8' },
  ],
  defaultVariants: { variant: 'plain', size: 'md' },
});

const iconSize = { sm: 'size-3.5', md: 'size-4' } as const;

type Look = {
  separator: BreadcrumbSeparator;
  variant: BreadcrumbVariant;
  size: BreadcrumbSize;
};

function Crumb({
  item,
  first,
  separator,
  variant,
  size,
}: { item: BreadcrumbItem; first: boolean } & Look) {
  const steps = variant === 'steps';
  return (
    // React Aria marks the last Breadcrumb as current (data-current), and its Link
    // gets aria-current="page" and stops being clickable.
    <AriaBreadcrumb className={crumbVariants({ variant, size })}>
      {steps && <StepShape first={first} />}
      <AriaLink
        href={item.href}
        className={cn(
          'inline-flex items-center gap-1.5 rounded px-0.5 underline-offset-4 outline-hidden',
          'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
          steps
            ? // On a filled segment: full-strength text; the current one is on primary.
              'text-fg hover:underline group-data-current:font-medium group-data-current:text-on-primary group-data-current:no-underline'
            : 'text-fg-muted hover:text-fg hover:underline group-data-current:font-medium group-data-current:text-fg group-data-current:no-underline',
        )}
      >
        {item.icon && (
          <span aria-hidden="true" className={cn('shrink-0', iconSize[size])}>
            {item.icon}
          </span>
        )}
        {/* iconOnly: the label is hidden on screen but stays the link's name. */}
        <span className={cn(item.iconOnly && item.icon && 'sr-only')}>
          {item.label}
        </span>
      </AriaLink>
      {!steps && <Separator kind={separator} size={size} />}
    </AriaBreadcrumb>
  );
}

/**
 * The steps segment, painted *behind* the link as its own element. The shape is cut
 * with `clip-path`, which also cuts off anything drawn outside it, focus outlines
 * included. So the link is never clipped; only this decoration is.
 */
function StepShape({ first }: { first: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        // `!`: the current segment stays primary even while hovered.
        'absolute inset-0 -z-10 bg-surface transition-colors group-hover:bg-border group-data-current:bg-primary!',
        first
          ? // Flat start, arrow end. Mirrored for right-to-left.
            '[clip-path:polygon(0_0,calc(100%-0.625rem)_0,100%_50%,calc(100%-0.625rem)_100%,0_100%)] rtl:[clip-path:polygon(0.625rem_0,100%_0,100%_100%,0.625rem_100%,0_50%)]'
          : // Notched start (the previous arrow fits in), arrow end.
            '[clip-path:polygon(0_0,calc(100%-0.625rem)_0,100%_50%,calc(100%-0.625rem)_100%,0_100%,0.625rem_50%)] rtl:[clip-path:polygon(0.625rem_0,100%_0,calc(100%-0.625rem)_50%,100%_100%,0.625rem_100%,0_50%)]',
        first ? 'rounded-s-md' : '',
      )}
    />
  );
}

function Separator({
  kind,
  size,
}: {
  kind: BreadcrumbSeparator;
  size: BreadcrumbSize;
}) {
  // Decoration: screen readers already hear a list of links.
  const cls = cn(
    'shrink-0 text-fg-muted group-data-current:hidden',
    iconSize[size],
  );
  if (kind === 'slash')
    return (
      <span
        aria-hidden="true"
        className="px-0.5 text-fg-muted group-data-current:hidden"
      >
        /
      </span>
    );
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
      className={cn('rtl:-scale-x-100', cls)}
    >
      {kind === 'arrow' ? (
        <path d="M3 8h10M9 4l4 4-4 4" />
      ) : (
        <path d="m6 3.5 4.5 4.5L6 12.5" />
      )}
    </svg>
  );
}
