import type { DOMAttributes, ReactElement, ReactNode } from 'react';
import {
  Focusable,
  Tooltip as AriaTooltip,
  TooltipTrigger,
} from 'react-aria-components';

export type TooltipProps = {
  /** The hint. Short: a few words ("Export as CSV"), not a paragraph. */
  content: ReactNode;
  /**
   * The element the hint is about: usually a Button. It must be focusable and pass
   * its props and `ref` through to a DOM element (all our controls do).
   *
   * The tooltip is a *description*, not a name: an icon-only Button still needs its
   * own `aria-label`. Screen readers read the label first, then this hint.
   */
  children: ReactElement;
  /** Which side the hint appears on. Flips if there's no room. @default 'top' */
  placement?: 'top' | 'bottom' | 'start' | 'end';
  /**
   * Milliseconds of hovering before the hint shows. Once one tooltip has shown, the
   * next ones show at once (React Aria's "warm-up"), so moving along a toolbar is fast.
   * @default 700
   */
  delay?: number;
  /** Don't show the hint (e.g. the button already has visible text). */
  disabled?: boolean;
};

/**
 * A small hint that appears when you hover or keyboard-focus an element, and hides
 * on Escape, a click, or moving away.
 *
 * Built on React Aria `TooltipTrigger` + `Tooltip`. `Focusable` lets it attach to our
 * own Button (a native `<button>`), so Button doesn't need to change.
 *
 * Use it for extra information only. It never shows on touch screens and only
 * appears after a delay, so nothing a user *needs* may live only in a tooltip.
 *
 * @example
 * <Tooltip content="Export as CSV">
 *   <Button intent="ghost" aria-label="Export"><DownloadIcon /></Button>
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 700,
  disabled,
}: TooltipProps) {
  return (
    <TooltipTrigger delay={delay} closeDelay={300} isDisabled={disabled}>
      {/* Focusable registers the child with the trigger (hover, focus, aria-describedby).
          Its type wants a plain DOM element; our components forward props and ref to
          one, which is all it needs at runtime. */}
      <Focusable>
        {children as ReactElement<DOMAttributes<Element>, string>}
      </Focusable>
      <AriaTooltip
        placement={placement}
        offset={6}
        className="max-w-64 rounded-md bg-secondary px-2 py-1 text-xs text-on-secondary shadow-md"
      >
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
