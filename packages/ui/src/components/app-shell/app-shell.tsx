import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
  type SVGProps,
} from 'react';
import { DialogTrigger } from 'react-aria-components';
import { Button } from '../button';
import { Drawer } from '../drawer';
import { TriggerButton } from '../button/trigger-button';
import { Tooltip } from '../tooltip';
import { cn } from '../../utils/cn';

/** The width where the sidebar stops being a drawer. Matches Tailwind's `lg`. */
const WIDE = '(min-width: 64rem)';

/**
 * What a SideNav needs to know about where it's shown: whether it's collapsed to icons
 * (wide sidebar only), and how to close the drawer it sits in (drawer only).
 */
const ShellNavContext = createContext<{
  collapsed: boolean;
  closeDrawer: () => void;
}>({ collapsed: false, closeDrawer: () => undefined });
export const useShellNav = () => useContext(ShellNavContext);

export type AppShellProps = {
  /** Top-left of the top bar: the product name or logo, usually a link home. */
  brand: ReactNode;
  /** Top-right of the top bar: search, notifications, the user menu. */
  actions?: ReactNode;
  /**
   * The app's navigation, usually a `SideNav`. Always shown on wide screens; on narrow
   * ones it opens as a drawer from the ☰ button.
   */
  sidebar: ReactNode;
  /** The page: usually a `PageHeader` and then the content. */
  children: ReactNode;
  /**
   * The `id` of `<main>`, which the skip link jumps to. Change it only if the page
   * already uses `main` for something else.
   * @default 'main'
   */
  mainId?: string;
  /**
   * The wide sidebar is collapsed to icons (controlled). Pair with
   * `onSidebarCollapsedChange`; e.g. to remember the choice in localStorage.
   */
  sidebarCollapsed?: boolean;
  /** Start collapsed (uncontrolled). @default false */
  defaultSidebarCollapsed?: boolean;
  /** Called when the user collapses or expands the sidebar. */
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
};

/**
 * The frame every page of the app sits in: a top bar, a sidebar, and the main area.
 *
 * - Landmarks: `<header>` (top bar), `<nav>` (inside `SideNav`), `<main>`. Screen
 *   reader users jump between them.
 * - A **skip link** is the first thing Tab reaches ("Skip to main content"). It's
 *   hidden until focused, and one Enter moves focus past the whole sidebar.
 * - Below 1024px the sidebar becomes a drawer (a React Aria modal: focus moves in and
 *   stays there, Escape or a click outside closes it, focus goes back to ☰). Choosing a
 *   link closes it.
 * - On wide screens the sidebar can collapse to icons (the button at its bottom).
 *   Labels stay in the page for screen readers and show as tooltips. The drawer is
 *   never collapsed.
 *
 * @example
 * <AppShell brand={<a href="/">Acme</a>} actions={<UserMenu />} sidebar={<MainNav />}>
 *   <PageHeader title="Invoices" />
 *   <InvoiceGrid />
 * </AppShell>
 */
export function AppShell({
  brand,
  actions,
  sidebar,
  children,
  mainId = 'main',
  sidebarCollapsed,
  defaultSidebarCollapsed = false,
  onSidebarCollapsedChange,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Controlled when `sidebarCollapsed` is set, otherwise we keep it ourselves.
  const [ownCollapsed, setOwnCollapsed] = useState(defaultSidebarCollapsed);
  const collapsed = sidebarCollapsed ?? ownCollapsed;
  const setCollapsed = (next: boolean) => {
    setOwnCollapsed(next);
    onSidebarCollapsedChange?.(next);
  };
  const asideId = useId();

  // If the window grows past the breakpoint while the drawer is open, close it:
  // otherwise a modal would sit on top of a page that already shows the sidebar.
  useEffect(() => {
    if (!drawerOpen || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(WIDE);
    const onChange = () => query.matches && setDrawerOpen(false);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <a
        href={`#${mainId}`}
        className="sr-only rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary focus:not-sr-only focus:fixed focus:px-3 focus:py-2 focus:start-3 focus:top-3 focus:z-50 focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-bg px-3 lg:px-4">
        <DialogTrigger isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
          <TriggerButton
            label={<MenuIcon className="size-5" />}
            aria-label="Open navigation"
            chevron={false}
            intent="ghost"
            size="sm"
            className="px-2 lg:hidden"
          />
          {/* Our Drawer: modal, focus in and back, Escape / × / click outside close. */}
          <Drawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            placement="start"
            title="Navigation"
            // p-1 / -m-1: room for the brand link's focus ring, which `truncate`
            // (overflow: hidden) would otherwise cut off. The text doesn't move.
            header={
              <div className="-m-1 truncate p-1 font-semibold">{brand}</div>
            }
            closeLabel="Close navigation"
            padding="sm"
            className="w-72 max-w-[85vw]"
          >
            <ShellNavContext.Provider
              value={{
                collapsed: false,
                closeDrawer: () => setDrawerOpen(false),
              }}
            >
              {sidebar}
            </ShellNavContext.Provider>
          </Drawer>
        </DialogTrigger>

        {/* p-1 / -m-1: room for the link's focus ring inside `truncate`. */}
        <div className="-m-1 min-w-0 truncate p-1 font-semibold">{brand}</div>
        {actions && (
          <div className="ms-auto flex items-center gap-1">{actions}</div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Wide screens only. On narrow ones the same nav lives in the drawer. */}
        <aside
          id={asideId}
          data-collapsed={collapsed || undefined}
          className={cn(
            'sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col border-e border-border lg:flex',
            'transition-[width] duration-200 motion-reduce:transition-none',
            collapsed ? 'w-16' : 'w-64',
          )}
        >
          <ShellNavContext.Provider
            value={{ collapsed, closeDrawer: () => undefined }}
          >
            <div
              className={cn(
                'min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-3',
                collapsed ? 'px-2' : 'px-3',
              )}
            >
              {sidebar}
            </div>
          </ShellNavContext.Provider>
          <div
            className={cn(
              'flex shrink-0 border-t border-border p-2',
              collapsed ? 'justify-center' : 'justify-end',
            )}
          >
            <Tooltip
              content="Expand sidebar"
              placement="end"
              disabled={!collapsed}
            >
              {/* aria-expanded + aria-controls: screen readers hear "Collapse
                  sidebar, button, expanded" and know what it acts on. */}
              <Button
                intent="ghost"
                size="sm"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!collapsed}
                aria-controls={asideId}
                onClick={() => setCollapsed(!collapsed)}
                className="px-2"
              >
                <CollapseIcon
                  className={cn(
                    'size-4 transition-transform motion-reduce:transition-none rtl:-scale-x-100',
                    collapsed && 'rotate-180',
                  )}
                />
              </Button>
            </Tooltip>
          </div>
        </aside>
        {/* tabIndex -1: the skip link can move focus here, but Tab doesn't stop on it. */}
        <main
          id={mainId}
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 outline-hidden lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      {...props}
    />
  );
}
function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </Svg>
  );
}
function CollapseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props} strokeLinejoin="round">
      <path d="M2.5 2.5v11M10 4.5 6.5 8l3.5 3.5M6.5 8h7" />
    </Svg>
  );
}
