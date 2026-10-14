import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from 'react';
import { Button as AriaButton, Heading } from 'react-aria-components';
import { cn } from '../../utils/cn';

/*
 * Pieces shared by Dialog, AlertDialog and Drawer (not exported from the package).
 * They must be rendered inside a React Aria `Dialog`, which gives `slot="title"` and
 * `slot="close"` their meaning.
 */

/** The × in the corner. `slot="close"`: React Aria wires it to close the dialog. */
export function DialogCloseButton({ label = 'Close' }: { label?: string }) {
  return (
    <AriaButton
      slot="close"
      aria-label={label}
      className="-me-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted outline-hidden hover:bg-surface hover:text-fg data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
    >
      <XIcon className="size-4" />
    </AriaButton>
  );
}

export function DialogTitle({ children }: { children: ReactNode }) {
  // slot="title": React Aria uses this heading as the dialog's accessible name.
  return (
    <Heading slot="title" className="text-lg font-semibold text-balance">
      {children}
    </Heading>
  );
}

export function DialogDescription({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="mt-1 text-sm text-fg-muted">
      {children}
    </p>
  );
}

/**
 * True while the element's content is taller than the element (it scrolls).
 * A ResizeObserver watches the box and its children; a MutationObserver re-checks
 * when children are added or removed (a list that loads, an error that appears).
 */
function useOverflowing<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    const resize = new ResizeObserver(check);
    const watch = () => {
      resize.disconnect();
      resize.observe(el);
      for (const child of Array.from(el.children)) resize.observe(child);
      check();
    };
    const mutations = new MutationObserver(watch);
    mutations.observe(el, { childList: true });
    watch();
    return () => {
      resize.disconnect();
      mutations.disconnect();
    };
  }, []);
  return [ref, overflowing] as const;
}

/**
 * The part of a Dialog, Drawer or Popover that scrolls, between the pinned header
 * and footer. While it overflows it is a Tab stop, so keyboard users can scroll it
 * with the arrow keys even when it holds only text (WCAG 2.1.1). Chrome and Firefox
 * do this for any scroll box; Safari doesn't. When it fits, it adds no Tab stop.
 */
export function DialogBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [ref, overflowing] = useOverflowing<HTMLDivElement>();
  return (
    <div
      ref={ref}
      tabIndex={overflowing ? 0 : undefined}
      data-overflowing={overflowing || undefined}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto text-sm outline-hidden',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus-ring',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        'flex flex-wrap justify-end gap-2 px-6 pt-2 pb-5',
        className,
      )}
    >
      {children}
    </footer>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      {...props}
    >
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </svg>
  );
}
