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
  children,
  footer,
  placement = 'end',
  size,
  dismissable = true,
  className,
}: DrawerProps) {
  const descriptionId = useId();
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
          aria-describedby={description ? descriptionId : undefined}
          className="flex min-h-0 flex-1 flex-col outline-hidden"
        >
          <header className="flex items-start gap-4 border-b border-border px-6 py-4">
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
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 text-sm">
            {children}
          </div>
          {footer && (
            <DialogFooter className="border-t border-border pt-4 pb-4">
              {footer}
            </DialogFooter>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
