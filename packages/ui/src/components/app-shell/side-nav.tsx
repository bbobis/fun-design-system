import { useId, type ReactNode } from 'react';
import { Link as AriaLink } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Tooltip } from '../tooltip';
import { useShellNav } from './app-shell';

export type SideNavProps = {
  /**
   * Names the `<nav>` landmark. Required: a page often has several navs (this one,
   * Breadcrumbs, Pagination), and screen readers list them by name.
   */
  'aria-label': string;
  /** `SideNavSection`s, each holding `SideNavItem`s. */
  children: ReactNode;
  className?: string;
};

/** The app's main navigation, for `AppShell`'s `sidebar`. */
export function SideNav({
  'aria-label': ariaLabel,
  children,
  className,
}: SideNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn('flex flex-col gap-5', className)}
    >
      {children}
    </nav>
  );
}

export type SideNavSectionProps = {
  /** A small label above the links ("Billing"). Leave it out for the first group. */
  title?: string;
  /** `SideNavItem`s. */
  children: ReactNode;
};

/**
 * A group of links. Renders a list; the title (if any) names it, so screen readers say
 * "Billing, list, 3 items".
 */
export function SideNavSection({ title, children }: SideNavSectionProps) {
  const id = useId();
  const { collapsed } = useShellNav();
  return (
    <div className="flex flex-col gap-1">
      {title && (
        // Collapsed: hidden from view, but still names the list for screen readers.
        <p
          id={id}
          className={cn(
            'px-2 text-xs font-medium tracking-wide text-fg-muted uppercase',
            collapsed && 'sr-only',
          )}
        >
          {title}
        </p>
      )}
      <ul
        aria-labelledby={title ? id : undefined}
        className="flex flex-col gap-0.5"
      >
        {children}
      </ul>
    </div>
  );
}

export type SideNavItemProps = {
  /** Where the link goes. */
  href: string;
  /** The link text. */
  children: ReactNode;
  /** A 16px icon before the text. Decorative: give it `aria-hidden`. */
  icon?: ReactNode;
  /**
   * This is the page the user is on. Highlighted, and marked `aria-current="page"` so
   * screen readers say "current page". Your router decides which item it is.
   */
  current?: boolean;
  /** Something small after the text, e.g. a count `<Badge>3</Badge>`. Hidden when the sidebar is collapsed. */
  end?: ReactNode;
};

/**
 * One link in the side nav. A React Aria `Link`, so with a `RouterProvider` it
 * navigates without a page reload. Inside the narrow-screen drawer, choosing it also
 * closes the drawer.
 */
export function SideNavItem({
  href,
  children,
  icon,
  current = false,
  end,
}: SideNavItemProps) {
  const { collapsed, closeDrawer } = useShellNav();
  return (
    <li>
      {/* Collapsed: the label shows as a tooltip. Always rendered (just disabled when
          expanded), so toggling doesn't remount the link and lose focus. */}
      <Tooltip
        content={children}
        kind="label"
        placement="end"
        disabled={!collapsed}
      >
        <AriaLink
          href={href}
          aria-current={current ? 'page' : undefined}
          onPress={closeDrawer}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg-muted outline-hidden transition-colors',
            'hover:bg-surface hover:text-fg',
            'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
            // Not colour alone: the current page also gets a background and bold text.
            current && 'bg-surface font-medium text-fg',
            collapsed && 'justify-center px-0 py-2',
          )}
        >
          {icon ? (
            <span className="flex size-4 shrink-0 items-center justify-center">
              {icon}
            </span>
          ) : (
            collapsed && (
              // No icon: show the first letter so the item still has a shape.
              <span
                aria-hidden="true"
                className="flex size-5 items-center justify-center rounded bg-surface text-xs font-semibold"
              >
                {typeof children === 'string' ? children.charAt(0) : '•'}
              </span>
            )
          )}
          {/* sr-only, not removed: the link keeps its name ("Invoices") when collapsed. */}
          <span
            className={cn('min-w-0 flex-1 truncate', collapsed && 'sr-only')}
          >
            {children}
          </span>
          {!collapsed && end}
        </AriaLink>
      </Tooltip>
    </li>
  );
}
