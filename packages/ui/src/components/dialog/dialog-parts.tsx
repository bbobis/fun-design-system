import type { ReactNode, SVGProps } from 'react';
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
