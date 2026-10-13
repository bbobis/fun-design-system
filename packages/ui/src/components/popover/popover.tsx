import { cva, type VariantProps } from 'class-variance-authority';
import { useId, type ReactElement, type ReactNode } from 'react';
import {
  Dialog,
  DialogTrigger,
  Heading,
  OverlayArrow,
  Popover as AriaPopover,
  Pressable,
} from 'react-aria-components';
import {
  TriggerButton,
  type TriggerButtonProps,
  type TriggerPlacement,
} from '../button/trigger-button';
import {
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
} from '../dialog/dialog-parts';
import { cn } from '../../utils/cn';
import { popoverMotion } from '../../utils/motion';

const panelVariants = cva(
  'flex rounded-md border border-border bg-bg text-fg shadow-lg outline-hidden',
  {
    variants: {
      size: {
        sm: 'w-64',
        md: 'w-80',
        lg: 'w-[28rem]',
        // Content sizes itself (a calendar, a short help text), within the screen.
        auto: 'w-auto max-w-[calc(100vw-1rem)]',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type Close = { close: () => void };
type PressableChild = Parameters<typeof Pressable>[0]['children'];
type Content = ReactNode | ((api: Close) => ReactNode);

/**
 * The trigger is EITHER our labelled button (`label` + its options) OR your own element
 * (`trigger`), never both. `never` on the other side makes TypeScript reject a mix:
 * `<Popover label="A" trigger={…}>` doesn't compile.
 */
type TriggerProps =
  | (TriggerButtonProps & { trigger?: never })
  | {
      /**
       * Your own trigger: an icon Button, a Button around an avatar or a chip. React
       * Aria wires press, Enter, Space and `aria-expanded` onto it. It must be a
       * **button** with an accessible name: a plain `<span>` gets focus and keys, but no
       * role, so screen readers read it as text, not as something that opens a panel
       * (React Aria warns: "child must have an interactive ARIA role"). Wrap it in a
       * Button.
       *
       * Also give the Popover a `title` (or keep the trigger to plain text): without
       * one the panel is named from the trigger's content, and Chrome includes hidden
       * bits like avatar initials in that name.
       */
      trigger: ReactElement;
      label?: never;
      'aria-label'?: never;
      chevron?: never;
      disabled?: never;
      intent?: never;
      size?: never;
      className?: never;
    };

export type PopoverProps = TriggerProps & {
  /**
   * Heading at the top of the panel; also its accessible name. Without it, the panel
   * is named by the trigger's label ("Filters").
   */
  title?: string;
  /** A short line under the title. Read out with the title. */
  description?: ReactNode;
  /**
   * Show a × in the corner. Escape and a click outside always close it; the × helps
   * touch users and makes "how do I close this?" obvious in a larger panel.
   * @default false
   */
  closeButton?: boolean;
  /**
   * The panel's content. It scrolls when it's taller than the space available. Pass a
   * function to get `close`: `{({ close }) => …}`.
   */
  children: Content;
  /**
   * Actions pinned under the content (main action last). A function gets `close`:
   * `footer={({ close }) => <Button onClick={() => { apply(); close(); }}>Apply</Button>}`
   */
  footer?: Content;
  /**
   * Panel width: `sm` 16rem, `md` 20rem, `lg` 28rem, `auto` fits the content.
   * @default 'md'
   */
  panelSize?: VariantProps<typeof panelVariants>['size'];
  /** A small arrow pointing at the trigger. It turns when the panel flips sides. @default false */
  arrow?: boolean;
  /** Where the panel opens, relative to the trigger. Flips if there's no room. @default 'bottom start' */
  placement?: TriggerPlacement;
  /** Open or closed (controlled). Leave both unset to let the Popover manage it. */
  open?: boolean;
  /** Called when the panel opens or closes (trigger, Escape, a click outside, `close`). */
  onOpenChange?: (open: boolean) => void;
};

const render = (content: Content, api: Close) =>
  typeof content === 'function' ? content(api) : content;

/**
 * A panel next to the element that opened it, for content the user interacts with:
 * filters, a few settings, a short form, details about something, help with a link.
 * Focus moves into the panel; Escape or a click outside closes it and puts focus back
 * on the trigger.
 *
 * Built on React Aria `DialogTrigger` + `Popover` + `Dialog`. Not modal like Dialog:
 * the page isn't dimmed, and the panel belongs to its trigger.
 *
 * Which overlay?
 * - **Tooltip**: a short label for an icon, on hover/focus. Nothing inside to click.
 * - **Popover**: content to read or use (links, fields, buttons) that belongs to one control.
 * - **Menu**: a list of actions or choices, with arrow-key navigation.
 * - **Dialog / Drawer**: a task that needs full attention, or more room.
 *
 * @example
 * <Popover label="Filters" title="Filter invoices" closeButton
 *   footer={({ close }) => <Button onClick={() => { apply(); close(); }}>Apply</Button>}>
 *   <Field label="Status"><Select options={statuses} /></Field>
 * </Popover>
 */
export function Popover({
  title,
  description,
  closeButton = false,
  children,
  footer,
  panelSize,
  arrow = false,
  placement = 'bottom start',
  open,
  onOpenChange,
  ...triggerProps
}: PopoverProps) {
  const descriptionId = useId();
  const hasHeader = Boolean(title || description || closeButton);
  return (
    <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
      {triggerProps.trigger ? (
        // Pressable gives any focusable element React Aria's press handling and
        // aria-expanded / aria-haspopup, exactly like the built-in trigger button.
        // Its type only allows plain elements (<button>), but at runtime any component
        // that passes props and ref through to its DOM element works, like our Button
        // (checked in Chromium and the tests).
        <Pressable>{triggerProps.trigger as PressableChild}</Pressable>
      ) : (
        <TriggerButton {...(triggerProps as TriggerButtonProps)} />
      )}
      <AriaPopover
        placement={placement}
        offset={arrow ? 10 : 4}
        className={cn(panelVariants({ size: panelSize }), popoverMotion)}
      >
        {arrow && (
          <OverlayArrow className="group">
            {/* Points up by default; React Aria sets data-placement so we can turn it. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className={cn(
                'block size-3 fill-bg stroke-border',
                'group-data-[placement=bottom]:rotate-180',
                'group-data-[placement=left]:-rotate-90',
                'group-data-[placement=right]:rotate-90',
              )}
            >
              <path d="M0 0 L6 6 L12 0" />
            </svg>
          </OverlayArrow>
        )}
        {/* A dialog inside the popover: focus moves in, Tab stays in until it closes. */}
        <Dialog
          aria-describedby={description ? descriptionId : undefined}
          className="flex max-h-[inherit] min-h-0 w-full flex-col outline-hidden"
        >
          {({ close }) => (
            <>
              {hasHeader && (
                <header className="flex items-start gap-3 px-4 pt-4">
                  <div className="min-w-0 flex-1">
                    {title && (
                      // slot="title" names the dialog. Without a title, React Aria
                      // names it after the trigger instead.
                      <Heading
                        slot="title"
                        className="text-sm font-semibold text-balance"
                      >
                        {title}
                      </Heading>
                    )}
                    {description && (
                      <DialogDescription id={descriptionId}>
                        {description}
                      </DialogDescription>
                    )}
                  </div>
                  {closeButton && <DialogCloseButton />}
                </header>
              )}
              {/* The body scrolls; header and footer stay. p-4 leaves room for focus
                  rings, which overflow would otherwise clip (recipe rule 26). */}
              <div
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto p-4 text-sm',
                  hasHeader && 'pt-3',
                )}
              >
                {render(children, { close })}
              </div>
              {footer !== undefined && (
                <DialogFooter className="border-t border-border px-4 py-3">
                  {render(footer, { close })}
                </DialogFooter>
              )}
            </>
          )}
        </Dialog>
      </AriaPopover>
    </DialogTrigger>
  );
}
