import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type SVGProps,
} from 'react';
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { TriggerButton } from '../button/trigger-button';

/** The width where the sidebar stops being a drawer. Matches Tailwind's `lg`. */
const WIDE = '(min-width: 64rem)';

/** Lets a SideNavItem close the drawer it sits in. Outside a drawer it does nothing. */
const DrawerContext = createContext<{ close: () => void }>({
  close: () => undefined,
});
export const useCloseDrawer = () => useContext(DrawerContext).close;

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
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          <ModalOverlay
            isDismissable
            className="fixed inset-0 z-50 bg-backdrop lg:hidden"
          >
            <Modal className="fixed inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col border-e border-border bg-bg shadow-xl outline-hidden">
              <Dialog
                aria-label="Navigation"
                className="flex min-h-0 flex-1 flex-col outline-hidden"
              >
                <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
                  <div className="min-w-0 truncate font-semibold">{brand}</div>
                  <AriaButton
                    slot="close"
                    aria-label="Close navigation"
                    className="flex size-8 items-center justify-center rounded-md text-fg-muted outline-hidden hover:bg-surface hover:text-fg data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
                  >
                    <XIcon className="size-4" />
                  </AriaButton>
                </div>
                <DrawerContext.Provider
                  value={{ close: () => setDrawerOpen(false) }}
                >
                  <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    {sidebar}
                  </div>
                </DrawerContext.Provider>
              </Dialog>
            </Modal>
          </ModalOverlay>
        </DialogTrigger>

        <div className="min-w-0 truncate font-semibold">{brand}</div>
        {actions && (
          <div className="ms-auto flex items-center gap-1">{actions}</div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Wide screens only. On narrow ones the same nav lives in the drawer. */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-e border-border p-3 lg:block">
          {sidebar}
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
function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props} strokeWidth={1.75}>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </Svg>
  );
}
