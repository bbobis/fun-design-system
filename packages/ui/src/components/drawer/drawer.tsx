import { cva, type VariantProps } from 'class-variance-authority';
import { useId, type ReactNode } from 'react';
import {
  Dialog as AriaDialog,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import {
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogBody,
} from '../dialog/dialog-parts';

// The panel: full height, pinned to one side. On a phone it leaves a 3rem strip of the
// page showing, so it's clear there's a page behind (and you can tap it to close).
const panelVariants = cva(
  'flex h-full w-[calc(100%-3rem)] flex-col border-border bg-bg text-fg shadow-xl outline-hidden',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
      },
      placement: {
        // Logical sides (start/end), not left/right: they flip in right-to-left
        // languages. The slide animation's starting offset flips with them.
        end: 'border-s [--drawer-from:100%] rtl:[--drawer-from:-100%]',
        start: 'border-e [--drawer-from:-100%] rtl:[--drawer-from:100%]',
      },
    },
    defaultVariants: { size: 'md', placement: 'end' },
  },
);

/** Inner spacing per `padding`. The footer keeps DialogFooter's gap and alignment. */
const spacing = {
  md: { header: 'px-6 py-4', body: 'px-6 py-4', footer: 'px-6 py-4' },
  // sm's header matches the app's top bar (h-14), so a nav drawer lines up with it.
  sm: { header: 'h-14 items-center px-3', body: 'p-3', footer: 'px-3 py-3' },
} as const;

export type DrawerProps = VariantProps<typeof panelVariants> & {
  /** Open or closed (controlled). Pair with `onOpenChange`. */
  open: boolean;
  /**
   * Called with `false` when the user closes the drawer: Escape, the × button, or a
   * click on the dimmed page. Set your state from it.
   */
  onOpenChange: (open: boolean) => void;
  /** Shown at the top and used as the drawer's accessible name. Required on purpose. */
  title: string;
  /** One or two sentences under the title. Read out with the title. */
  description?: ReactNode;
  /**
   * Shown at the top **instead of** `title` and `description`, e.g. a logo. `title`
   * still names the drawer for screen readers (as `aria-label`).
   */
  header?: ReactNode;
  /**
   * The × button's accessible name. Say what closes when that's clearer.
   * @default 'Close'
   */
  closeLabel?: string;
  /** The content: a form, details, filters. It scrolls; the header and footer don't. */
  children?: ReactNode;
  /** Action buttons, pinned to the bottom (main action last). */
  footer?: ReactNode;
  /**
   * `'end'` (right in left-to-right languages) or `'start'` (left). Use `end` for
   * details and editing, `start` for navigation or filters that sit beside the content.
   * @default 'end'
   */
  placement?: 'start' | 'end';
  /**
   * Space inside the header, body and footer: `md` for forms and details, `sm` for
   * dense content like navigation. Same names as Card's `padding`.
   * @default 'md'
   */
  padding?: 'sm' | 'md';
  /**
   * A click on the dimmed page closes the drawer. Turn it off when closing would lose
   * typed work (a long form). Escape and the × always close.
   * @default true
   */
  dismissable?: boolean;
  /** Classes for the panel (e.g. a custom width). */
  className?: string;
};

/**
 * A panel that slides in from the side of the screen, over the page, for work that
 * needs more room than a Dialog or that relates to the page behind it: edit a record
 * from a list, see its details, set filters. Full height; the body scrolls and the
 * footer stays at the bottom.
 *
 * It's a modal dialog: while it's open, the page behind can't be reached with the
 * mouse, Tab or a screen reader. Focus moves into it and goes back to the button that
 * opened it when it closes. Built on React Aria `ModalOverlay` + `Modal` + `Dialog`,
 * sharing its header and footer with our Dialog.
 *
 * @example
 * <Drawer open={open} onOpenChange={setOpen} title="Edit invoice"
 *   footer={<><Button intent="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button>Save</Button></>}>
 *   <Field label="Customer"><Input /></Field>
 * </Drawer>
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  header,
  closeLabel,
  children,
  footer,
  placement = 'end',
  size,
  padding = 'md',
  dismissable = true,
  className,
}: DrawerProps) {
  const descriptionId = useId();
  const space = spacing[padding];
  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable={dismissable}
      className={cn(
        // justify-end/start are logical too: in right-to-left they flip on their own.
        'fixed inset-0 z-50 flex bg-backdrop',
        placement === 'end' ? 'justify-end' : 'justify-start',
        'motion-safe:data-entering:animate-overlay-in motion-safe:data-exiting:animate-overlay-out',
      )}
    >
      <Modal
        data-placement={placement}
        className={cn(
          panelVariants({ size, placement }),
          'motion-safe:data-entering:animate-drawer-in motion-safe:data-exiting:animate-drawer-out',
          className,
        )}
      >
        <AriaDialog
          // With a custom header there's no visible title heading, so the title
          // names the dialog directly.
          aria-label={header ? title : undefined}
          aria-describedby={description && !header ? descriptionId : undefined}
          className="flex min-h-0 flex-1 flex-col outline-hidden"
        >
          <header
            className={cn(
              'flex items-start gap-4 border-b border-border',
              space.header,
            )}
          >
            <div className="min-w-0 flex-1">
              {header ?? (
                <>
                  <DialogTitle>{title}</DialogTitle>
                  {description && (
                    <DialogDescription id={descriptionId}>
                      {description}
                    </DialogDescription>
                  )}
                </>
              )}
            </div>
            <DialogCloseButton label={closeLabel} />
          </header>
          <DialogBody className={space.body}>{children}</DialogBody>
          {footer && (
            <DialogFooter
              className={cn('border-t border-border', space.footer)}
            >
              {footer}
            </DialogFooter>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
