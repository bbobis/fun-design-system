import { cva, type VariantProps } from 'class-variance-authority';
import { useId, useState, type ReactNode, type SVGProps } from 'react';
import {
  Dialog as AriaDialog,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Button } from '../button';
import {
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogBody,
} from './dialog-parts';

// The panel. Width by `size`; never taller than the screen (the body scrolls instead).
const panelVariants = cva(
  'flex w-full flex-col border-border bg-bg text-fg shadow-xl outline-hidden',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
        // The whole screen: no gap, no corners, no border. The overlay drops its
        // padding for this size (see DialogFrame).
        full: 'h-dvh max-w-none',
      },
    },
    compoundVariants: [
      {
        size: ['sm', 'md', 'lg', 'xl'],
        className: 'max-h-[calc(100dvh-2rem)] rounded-lg border',
      },
    ],
    defaultVariants: { size: 'md' },
  },
);

/** Where the panel sits on the screen. `full` ignores it (it fills the screen). */
type Placement = 'center' | 'top';

/**
 * Inner spacing. `divided` adds lines and gives the header and footer equal
 * padding (like Drawer), so the lines sit halfway between the text and the body.
 */
const sections = {
  plain: { header: 'px-6 pt-5', body: 'px-6 py-4', footer: undefined },
  divided: {
    header: 'border-b border-border px-6 py-4',
    body: 'px-6 py-4',
    footer: 'border-t border-border px-6 py-4',
  },
} as const;

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
  /**
   * `'center'` (middle of the screen) or `'top'` (a little below the top edge). Use
   * `top` when the content grows or shrinks while it's open (search results, a
   * step that adds fields): the top edge stays put, so the text doesn't jump.
   * @default 'center'
   */
  placement?: Placement;
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
  /**
   * Lines under the header and above the footer. Turn it on for long content that
   * scrolls, so it's clear where the fixed parts end.
   * @default false
   */
  divided?: boolean;
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
  placement,
  dismissable = true,
  divided = false,
  className,
}: DialogProps) {
  const descriptionId = useId();
  const space = sections[divided ? 'divided' : 'plain'];
  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      dismissable={dismissable}
      describedBy={description ? descriptionId : undefined}
      role="dialog"
      size={size}
      placement={placement}
      className={className}
    >
      <header className={cn('flex items-start gap-4', space.header)}>
        <div className="min-w-0 flex-1">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription id={descriptionId}>
              {description}
            </DialogDescription>
          )}
        </div>
        <DialogCloseButton />
      </header>
      {children !== undefined && (
        <DialogBody className={space.body}>{children}</DialogBody>
      )}
      {footer && <DialogFooter className={space.footer}>{footer}</DialogFooter>}
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
  /**
   * Shows an icon in a colored circle beside (or above) the title. `danger` for
   * deleting, `warning` for "you'll lose changes", `info` for a heads-up. The title
   * must still say what's at stake: the icon is decoration.
   */
  tone?: AlertTone;
  /**
   * `'start'`: text and icon left-aligned, buttons on the end. `'center'`: icon on
   * top, text centered, buttons sharing the width (feels at home on a phone).
   * @default 'start'
   */
  layout?: 'start' | 'center';
};

type AlertTone = 'info' | 'warning' | 'danger';

// Same color names as Alert's soft style: a pale circle with a darker icon.
const toneCircle: Record<AlertTone, string> = {
  info: 'bg-info-soft text-on-info-soft',
  warning: 'bg-warning-soft text-on-warning-soft',
  danger: 'bg-danger-soft text-on-danger-soft',
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
  placement,
  tone,
  layout = 'start',
  className,
}: AlertDialogProps) {
  const centered = layout === 'center';
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
      placement={placement}
      className={className}
    >
      <header
        className={cn(
          'flex gap-4 px-6 pt-5',
          centered ? 'flex-col items-center text-center' : 'items-start',
        )}
      >
        {tone && (
          <span
            data-tone={tone}
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              toneCircle[tone],
            )}
          >
            {toneIcons[tone]({ className: 'size-5' })}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription id={descriptionId}>
              {description}
            </DialogDescription>
          )}
        </div>
      </header>
      <DialogFooter
        // Centered: the buttons share the row equally (flex-1 only in a row: in a
        // column it would squash their height); on a narrow phone they stack
        // full width, with the confirm button on top (column-reverse keeps the DOM, and
        // so the Tab order, Cancel → Confirm).
        className={cn(
          // More room above the buttons when an icon or centered text sits there.
          (tone || centered) && 'pt-4',
          centered && 'max-sm:flex-col-reverse sm:*:flex-1',
        )}
      >
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
  placement = 'center',
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
  placement?: Placement;
  className?: string;
  children: ReactNode;
}) {
  const full = size === 'full';
  return (
    // The dimmed layer over the page. React Aria makes everything behind it inert
    // (aria-hidden + no Tab) and locks page scroll while it's open.
    <ModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable={dismissable}
      className={cn(
        'fixed inset-0 z-50 flex justify-center bg-backdrop',
        full
          ? 'items-stretch'
          : placement === 'top'
            ? // 10% of the screen down, but never less than the 1rem edge gap.
              'items-start p-4 pt-[max(1rem,10dvh)]'
            : 'items-center p-4',
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

function Svg(props: SVGProps<SVGSVGElement>) {
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
    />
  );
}

// The same drawings as Alert's icons, so a tone looks the same everywhere.
const toneIcons: Record<AlertTone, (p: SVGProps<SVGSVGElement>) => ReactNode> =
  {
    info: (p) => (
      <Svg {...p}>
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 7.25v3.5M8 5.25h.01" />
      </Svg>
    ),
    warning: (p) => (
      <Svg {...p}>
        <path d="M8 2.25 1.75 13.25h12.5z" />
        <path d="M8 6.75v3M8 11.5h.01" />
      </Svg>
    ),
    danger: (p) => (
      <Svg {...p}>
        <circle cx="8" cy="8" r="6.25" />
        <path d="m5.75 5.75 4.5 4.5m0-4.5-4.5 4.5" />
      </Svg>
    ),
  };
