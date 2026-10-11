import { cva, type VariantProps } from 'class-variance-authority';
import { useId, useState, type ReactNode, type SVGProps } from 'react';
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Button } from '../button';

// The panel. Width by `size`; never taller than the screen (the body scrolls instead).
const panelVariants = cva(
  [
    'flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-lg border border-border bg-bg text-fg shadow-xl',
    'outline-hidden',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-3xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type DialogBaseProps = VariantProps<typeof panelVariants> & {
  /** Open or closed (controlled). Pair with `onOpenChange`. */
  open: boolean;
  /**
   * Called with `false` when the user closes the dialog: Escape, the × button, or a
   * click on the dimmed page. Set your state from it.
   */
  onOpenChange: (open: boolean) => void;
  /** Shown at the top and used as the dialog's accessible name. Required on purpose. */
  title: string;
  /** One or two sentences under the title. Read out with the title. */
  description?: ReactNode;
  /** Classes for the panel (e.g. a custom width). */
  className?: string;
};

export type DialogProps = DialogBaseProps & {
  /** The dialog's content: a form, details, a small table. Scrolls when it's long. */
  children?: ReactNode;
  /**
   * The action buttons, right-aligned at the bottom (main action last). Usually a
   * `secondary` Cancel and one `primary` button.
   */
  footer?: ReactNode;
  /**
   * A click on the dimmed page closes the dialog. Turn it off when closing would lose
   * typed work (a long form). Escape and the × always close.
   * @default true
   */
  dismissable?: boolean;
};

/**
 * A window on top of the page for a focused task (edit a record, review details).
 * While it's open, the page behind can't be reached with the mouse, Tab or a screen
 * reader; focus starts inside and goes back to where it was (usually the button that
 * opened it) when it closes.
 *
 * Built on React Aria `ModalOverlay` + `Modal` + `Dialog`. Controlled: open it from any
 * button with `onClick={() => setOpen(true)}`.
 *
 * For "Are you sure?" questions use `AlertDialog`.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size,
  dismissable = true,
  className,
}: DialogProps) {
  const descriptionId = useId();
  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      dismissable={dismissable}
      describedBy={description ? descriptionId : undefined}
      role="dialog"
      size={size}
      className={className}
    >
      <header className="flex items-start gap-4 px-6 pt-5">
        <div className="min-w-0 flex-1">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription id={descriptionId}>
              {description}
            </DialogDescription>
          )}
        </div>
        {/* slot="close": React Aria wires it to close the dialog. */}
        <AriaButton
          slot="close"
          aria-label="Close"
          className="-me-2 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted outline-hidden hover:bg-surface hover:text-fg data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
        >
          <XIcon className="size-4" />
        </AriaButton>
      </header>
      {children !== undefined && (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 text-sm">
          {children}
        </div>
      )}
      {footer && <DialogFooter>{footer}</DialogFooter>}
    </DialogFrame>
  );
}

export type AlertDialogProps = DialogBaseProps & {
  /** The button that does the thing, as a verb: "Delete invoice", not "OK". */
  confirmLabel: string;
  /** @default 'Cancel' */
  cancelLabel?: string;
  /**
   * `danger` for anything that destroys data or can't be undone.
   * @default 'danger'
   */
  intent?: 'primary' | 'danger';
  /**
   * Called on the confirm button. Return a promise (an API call) and the button shows a
   * spinner until it settles: resolved → the dialog closes; rejected → it stays open
   * so you can show the error. Return nothing and it closes straight away.
   */
  onConfirm: () => void | Promise<unknown>;
};

/**
 * Asks before doing something that matters ("Delete 3 invoices?"). Compared to Dialog:
 * - role `alertdialog`, so screen readers announce it as urgent;
 * - a click outside doesn't close it (it needs an answer); Escape means Cancel;
 * - focus starts on **Cancel**, the safe choice, so a stray Enter can't delete anything.
 */
export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  intent = 'danger',
  onConfirm,
  size = 'sm',
  className,
}: AlertDialogProps) {
  const [busy, setBusy] = useState(false);
  const descriptionId = useId();

  const confirm = async () => {
    const result = onConfirm();
    if (!(result instanceof Promise)) return onOpenChange(false);
    setBusy(true);
    try {
      await result;
      onOpenChange(false);
    } catch {
      // Stay open: the app shows the error (e.g. in `description` or a toast).
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogFrame
      open={open}
      // While the action runs, Escape can't close it: the outcome would be unclear.
      onOpenChange={(next) => !busy && onOpenChange(next)}
      dismissable={false}
      describedBy={description ? descriptionId : undefined}
      role="alertdialog"
      size={size}
      className={className}
    >
      <header className="px-6 pt-5">
        <DialogTitle>{title}</DialogTitle>
        {description && (
          <DialogDescription id={descriptionId}>
            {description}
          </DialogDescription>
        )}
      </header>
      <DialogFooter>
        <Button
          intent="secondary"
          // The safe answer gets focus first. React focuses it on mount; React Aria
          // keeps focus where it already is inside the dialog.
          autoFocus
          disabled={busy}
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </Button>
        <Button intent={intent} loading={busy} onClick={confirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogFrame>
  );
}

/** Overlay + modal + dialog: the part Dialog and AlertDialog share. */
function DialogFrame({
  open,
  onOpenChange,
  dismissable,
  describedBy,
  role,
  size,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissable: boolean;
  /** React Aria names the dialog from its title; the description we wire ourselves. */
  describedBy: string | undefined;
  role: 'dialog' | 'alertdialog';
  size: DialogBaseProps['size'];
  className?: string;
  children: ReactNode;
}) {
  return (
    // The dimmed layer over the page. React Aria makes everything behind it inert
    // (aria-hidden + no Tab) and locks page scroll while it's open.
    <ModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable={dismissable}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-backdrop p-4',
        // Fade the backdrop; the panel pops in on its own (below).
        'motion-safe:data-entering:animate-overlay-in motion-safe:data-exiting:animate-overlay-out',
      )}
    >
      <Modal
        className={cn(
          panelVariants({ size }),
          'motion-safe:data-entering:animate-dialog-in motion-safe:data-exiting:animate-dialog-out',
          className,
        )}
      >
        {/* Focus is trapped in here; on close it returns to the element that had it. */}
        <AriaDialog
          role={role}
          aria-describedby={describedBy}
          className="flex min-h-0 flex-1 flex-col outline-hidden"
        >
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

function DialogTitle({ children }: { children: ReactNode }) {
  // slot="title": React Aria uses this heading as the dialog's accessible name.
  return (
    <Heading slot="title" className="text-lg font-semibold text-balance">
      {children}
    </Heading>
  );
}

function DialogDescription({
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

function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="flex flex-wrap justify-end gap-2 px-6 pt-2 pb-5">
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
