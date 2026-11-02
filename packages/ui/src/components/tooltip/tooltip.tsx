import type { DOMAttributes, ReactElement, ReactNode } from 'react';
import {
  Focusable,
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { tooltipMotion } from '../../utils/motion';

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
  /**
   * - `description` (default): the hint adds information ("Export as CSV" on an
   *   "Export" button). Screen readers read it after the name.
   * - `label`: the hint only repeats the element's own name (an icon-only nav item
   *   whose label is visually hidden). Screen readers skip it, so they don't say the
   *   name twice. The element must already be named (text or `aria-label`).
   * @default 'description'
   */
  kind?: 'description' | 'label';
  /**
   * `inverse`: dark on a light page (light on a dark one), the usual tooltip.
   * `light`: the page's own colors with a border, for a calmer hint on busy screens.
   * @default 'inverse'
   */
  variant?: 'inverse' | 'light';
  /** `sm` for a few words; `md` for one sentence (bigger text, wider). @default 'sm' */
  size?: 'sm' | 'md';
  /** A small arrow pointing at the element. It turns when the hint flips sides. @default false */
  arrow?: boolean;
};

const variants = {
  inverse: { panel: 'bg-secondary text-on-secondary', arrow: 'fill-secondary' },
  light: {
    panel: 'border border-border bg-bg text-fg',
    arrow: 'fill-bg stroke-border',
  },
} as const;

const sizes = {
  sm: 'max-w-64 px-2 py-1 text-xs',
  md: 'max-w-80 px-3 py-2 text-sm',
} as const;

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
  kind = 'description',
  variant = 'inverse',
  size = 'sm',
  arrow = false,
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
        offset={arrow ? 9 : 6}
        className={cn(
          'rounded-md shadow-md',
          variants[variant].panel,
          sizes[size],
          tooltipMotion,
        )}
      >
        {arrow && (
          <OverlayArrow className="group">
            {/* Points down (tooltip above the element); React Aria sets
                data-placement so we can turn it for the other sides. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 10 10"
              className={cn(
                'block size-2.5',
                variants[variant].arrow,
                'group-data-[placement=bottom]:rotate-180',
                'group-data-[placement=left]:-rotate-90',
                'group-data-[placement=right]:rotate-90',
              )}
            >
              <path d="M0 0 L5 5 L10 0" />
            </svg>
          </OverlayArrow>
        )}
        {kind === 'label' ? (
          // React Aria still points aria-describedby at the tooltip. A description
          // follows that reference even to hidden elements, but skips the referenced
          // element's aria-hidden *children*, so the description comes out empty.
          // (aria-hidden on the tooltip itself would not work.)
          <span aria-hidden="true">{content}</span>
        ) : (
          content
        )}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
