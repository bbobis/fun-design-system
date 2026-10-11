import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogTrigger,
  Heading,
  Popover as AriaPopover,
} from 'react-aria-components';
import {
  TriggerButton,
  type TriggerButtonProps,
  type TriggerPlacement,
} from '../button/trigger-button';
import { cn } from '../../utils/cn';
import { popoverMotion } from '../../utils/motion';

const panelVariants = cva(
  'rounded-md border border-border bg-bg text-fg shadow-lg outline-hidden',
  {
    variants: {
      size: {
        sm: 'w-64',
        md: 'w-80',
        lg: 'w-[28rem]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type PopoverProps = TriggerButtonProps & {
  /**
   * Heading at the top of the panel; also its accessible name. Without it, the panel
   * is named by the trigger's label ("Filters").
   */
  title?: string;
  /**
   * The panel's content. Pass a function to get `close`, for an "Apply" button:
   * `{({ close }) => <Button onClick={() => { apply(); close(); }}>Apply</Button>}`
   */
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  /** Panel width: `sm` 16rem, `md` 20rem, `lg` 28rem. @default 'md' */
  panelSize?: VariantProps<typeof panelVariants>['size'];
  /** Where the panel opens, relative to the trigger. Flips if there's no room. @default 'bottom start' */
  placement?: TriggerPlacement;
  /** Open or closed (controlled). Leave both unset to let the Popover manage it. */
  open?: boolean;
  /** Called when the panel opens or closes (trigger, Escape, a click outside, `close`). */
  onOpenChange?: (open: boolean) => void;
};

/**
 * A button that opens a small panel next to it: filters, a few settings, details about
 * something. Focus moves into the panel; Escape or a click outside closes it and puts
 * focus back on the button.
 *
 * Built on React Aria `DialogTrigger` + `Popover` + `Dialog`. Not modal like Dialog:
 * the page isn't dimmed, and the panel belongs to the button that opened it. For a
 * list of actions use Menu; for a task that needs the user's full attention, Dialog.
 *
 * @example
 * <Popover label="Filters" title="Filter invoices">
 *   {({ close }) => (
 *     <>
 *       <Field label="Status"><Select options={statuses} /></Field>
 *       <Button onClick={() => { apply(); close(); }}>Apply</Button>
 *     </>
 *   )}
 * </Popover>
 */
export function Popover({
  title,
  children,
  panelSize,
  placement = 'bottom start',
  open,
  onOpenChange,
  ...trigger
}: PopoverProps) {
  return (
    <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
      <TriggerButton {...trigger} />
      <AriaPopover
        placement={placement}
        offset={4}
        className={cn(panelVariants({ size: panelSize }), popoverMotion)}
      >
        {/* A dialog inside the popover: focus moves in, Tab stays in until it closes. */}
        <Dialog className="max-h-[inherit] overflow-auto p-4 outline-hidden">
          {({ close }) => (
            <>
              {title && (
                // slot="title" names the dialog. Without a title, React Aria names it
                // after the trigger button instead.
                <Heading slot="title" className="mb-3 text-sm font-semibold">
                  {title}
                </Heading>
              )}
              {typeof children === 'function' ? children({ close }) : children}
            </>
          )}
        </Dialog>
      </AriaPopover>
    </DialogTrigger>
  );
}
