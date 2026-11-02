import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { cssVars } from '../../utils/css-vars';

export type SplitPanesOrientation = 'horizontal' | 'vertical';

export type SplitPanesProps = {
  /** The pane the handle resizes (first: start side, or top). */
  primary: ReactNode;
  /** The other pane. It takes the rest of the space. */
  secondary: ReactNode;
  /**
   * Names the handle for screen readers: what it resizes ("Message list"). They
   * hear "Message list, separator, 35".
   */
  separatorLabel: string;
  /**
   * `horizontal`: panes side by side, handle is a vertical bar, ←/→ move it.
   * `vertical`: panes stacked, handle is a horizontal bar, ↑/↓ move it.
   * @default 'horizontal'
   */
  orientation?: SplitPanesOrientation;
  /** The primary pane's size in % of the container (controlled). */
  size?: number;
  /** Starting size in % when uncontrolled. @default 50 */
  defaultSize?: number;
  /** Called with the new size in % (rounded to 0.1) while dragging or on each key. */
  onSizeChange?: (size: number) => void;
  /** Smallest size in % (Home goes here). @default 10 */
  min?: number;
  /** Largest size in % (End goes here). @default 90 */
  max?: number;
  /** % moved per arrow key; Shift moves 4×. @default 5 */
  step?: number;
  /**
   * Enter hides the primary pane (size 0) and Enter again brings back its last size.
   * A hidden pane gets the `hidden` attribute, so Tab skips what can't be seen.
   * @default false
   */
  collapsible?: boolean;
  /** Classes for the outer box (give it a height for `vertical`). */
  className?: string;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Two panes and a handle between them that resizes the first one: a mail list and a
 * reading pane, an editor and its console. Follows the ARIA "window splitter"
 * pattern: the handle is a focusable `separator` whose value is the primary pane's
 * size, with `aria-controls` pointing at that pane.
 *
 * Keyboard: arrows move the handle (Shift: 4× faster), Home / End jump to `min` /
 * `max`, Enter collapses and restores (with `collapsible`). Arrows follow the handle
 * on screen, so in a right-to-left page → still moves it right.
 *
 * Built by hand: React Aria Components has no splitter, and it's a small amount of
 * code (pointer capture + key handling).
 */
export function SplitPanes({
  primary,
  secondary,
  separatorLabel,
  orientation = 'horizontal',
  size,
  defaultSize = 50,
  onSizeChange,
  min = 10,
  max = 90,
  step = 5,
  collapsible = false,
  className,
}: SplitPanesProps) {
  const paneId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultSize);
  const current = size ?? uncontrolled;
  // The size to come back to after a collapse.
  const lastOpen = useRef(current > 0 ? current : defaultSize);
  const [dragging, setDragging] = useState(false);
  const horizontal = orientation === 'horizontal';
  const collapsed = collapsible && current === 0;

  const set = (next: number) => {
    const value = round(next);
    if (value > 0) lastOpen.current = value;
    if (value === current) return;
    if (size === undefined) setUncontrolled(value);
    onSizeChange?.(value);
  };
  const setClamped = (next: number) => set(clamp(next, min, max));

  /** Right-to-left page: the primary pane is on the right, so "right" means "smaller". */
  const isRtl = () => {
    const box = boxRef.current;
    if (!box) return false;
    // Browsers always compute `direction` (from dir="rtl" or CSS). jsdom leaves it
    // empty, so fall back to the nearest dir attribute.
    const computed = getComputedStyle(box).direction;
    return (computed || box.closest('[dir]')?.getAttribute('dir')) === 'rtl';
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const amount = e.shiftKey ? step * 4 : step;
    // +1 = handle moves toward the end (primary grows), -1 = toward the start.
    let direction = 0;
    if (horizontal && e.key === 'ArrowRight') direction = isRtl() ? -1 : 1;
    else if (horizontal && e.key === 'ArrowLeft') direction = isRtl() ? 1 : -1;
    else if (!horizontal && e.key === 'ArrowDown') direction = 1;
    else if (!horizontal && e.key === 'ArrowUp') direction = -1;

    if (direction !== 0) {
      // From collapsed, any arrow toward "bigger" starts again at min.
      setClamped(collapsed ? min : current + direction * amount);
    } else if (e.key === 'Home') {
      setClamped(min);
    } else if (e.key === 'End') {
      setClamped(max);
    } else if (e.key === 'Enter' && collapsible) {
      set(collapsed ? lastOpen.current : 0);
    } else {
      return;
    }
    e.preventDefault(); // arrows would also scroll the page
  };

  /** Pointer position → primary size in %, measured from the primary pane's edge. */
  const sizeAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return current;
    if (!horizontal) return ((e.clientY - box.top) / box.height) * 100;
    const fromStart = isRtl() ? box.right - e.clientX : e.clientX - box.left;
    return (fromStart / box.width) * 100;
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // Capture: every following pointermove comes to the handle, even when the pointer
    // is over the panes (or an iframe) or outside the window.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
    e.preventDefault(); // no text selection while dragging
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setClamped(sizeAt(e));
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  return (
    <div
      ref={boxRef}
      data-orientation={orientation}
      data-dragging={dragging || undefined}
      className={cn(
        'flex min-h-0 min-w-0 overflow-hidden',
        horizontal ? 'flex-row' : 'flex-col',
        // While dragging, the whole box shows the resize cursor and nothing selects.
        dragging &&
          (horizontal
            ? 'cursor-col-resize select-none'
            : 'cursor-row-resize select-none'),
        className,
      )}
    >
      <div
        id={paneId}
        hidden={collapsed}
        // The size is a runtime number: a CSS variable, read by a Tailwind class.
        style={cssVars({ '--split': `${current}%` })}
        className="min-h-0 min-w-0 shrink-0 grow-0 basis-(--split) overflow-auto"
      >
        {primary}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={separatorLabel}
        aria-controls={paneId}
        // A separator's own orientation is the line's direction: panes side by side
        // are split by a vertical line.
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={round(current)}
        aria-valuemin={collapsible ? 0 : min}
        aria-valuemax={max}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          // A 1px line you see, inside an 8px strip you can grab (touch-friendly
          // enough with the pointer capture). touch-none: don't scroll while dragging.
          'group relative flex shrink-0 touch-none items-center justify-center outline-hidden',
          horizontal ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize',
          // The focus ring goes on the grip (below): the strip is too thin for one.
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'bg-border transition-colors group-hover:bg-border-strong group-focus-visible:bg-primary',
            horizontal ? 'h-full w-px' : 'h-px w-full',
            dragging && 'bg-primary',
          )}
        />
        {/* Grip dots, so the handle looks like something you can grab. */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute flex gap-0.5 rounded-full border border-border bg-bg p-0.5',
            horizontal ? 'flex-col' : 'flex-row',
            // Keyboard focus: a ring around the grip, plus the line turns primary.
            'group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-solid group-focus-visible:outline-focus-ring',
          )}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-0.5 rounded-full bg-fg-muted" />
          ))}
        </span>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{secondary}</div>
    </div>
  );
}
