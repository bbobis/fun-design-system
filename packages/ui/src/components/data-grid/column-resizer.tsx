import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '../../utils/cn';
import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from './column-state';

export type ColumnResizerProps = {
  /** The column's name: the handle is "Resize Customer column". */
  label: string;
  columnId: string;
  width: number;
  /** A new width while dragging or pressing arrows (the grid clamps it). */
  onResize: (px: number) => void;
  /** Double-click: fit the column to its content. */
  onFit: () => void;
  /** Enter or Escape: resizing is done (the grid puts focus back on the ⌄ button). */
  onDone: () => void;
};

/**
 * The grab handle on a header's end edge. Drag it, or double-click to fit.
 *
 * Keyboard users get here from the column menu's "Resize column" (it isn't a Tab stop,
 * see below). Then ←/→ change the width by 10px (Shift: 50px) and Enter or Escape
 * finish. It's an ARIA `separator` with a value: focusable separators are widgets,
 * like a slider, so screen readers say "Resize Customer column, 180".
 *
 * Why not a Tab stop: every header already has two (sort, ⌄). A third per column
 * would make tabbing across a 20-column grid 60 presses. React Aria's Table does the
 * same: "Resize" lives in the column menu.
 */
export function ColumnResizer({
  label,
  columnId,
  width,
  onResize,
  onFit,
  onDone,
}: ColumnResizerProps) {
  const drag = useRef<{ x: number; width: number; dir: 1 | -1 } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault(); // no text selection, no focus jump
    // Pointer capture: every move and the release come to this element, even when
    // the pointer leaves it (it will: the edge moves with the column, the mouse
    // races ahead). No document-level listeners to add and remember to remove.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    drag.current = { x: e.clientX, width, dir: rtl ? -1 : 1 };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d) onResize(d.width + (e.clientX - d.x) * d.dir);
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 50 : 10;
    // In right-to-left layouts the end edge is on the left, so ← widens.
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const grow = rtl ? 'ArrowLeft' : 'ArrowRight';
    const shrink = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === grow) onResize(width + step);
    else if (e.key === shrink) onResize(width - step);
    else if (e.key === 'Home') onResize(MIN_COLUMN_WIDTH);
    else if (e.key === 'End') onResize(MAX_COLUMN_WIDTH);
    else if (e.key === 'Enter' || e.key === 'Escape') onDone();
    else return;
    e.preventDefault();
    e.stopPropagation(); // not the grid's or the scroll region's arrows
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuenow={width}
      aria-valuemin={MIN_COLUMN_WIDTH}
      aria-valuemax={MAX_COLUMN_WIDTH}
      // The grid focuses it from the column menu; not in the Tab order.
      tabIndex={-1}
      data-column-resizer={columnId}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onFit}
      onKeyDown={onKeyDown}
      className={cn(
        // 8px to grab, centred on the edge. touch-none: dragging on a touch screen
        // resizes instead of scrolling the grid.
        'absolute inset-y-0 -end-1 z-[2] flex w-2 cursor-col-resize touch-none justify-center outline-hidden',
        // The visible line: on hover, while dragging, and (thicker) with keyboard focus.
        "after:w-px after:bg-transparent after:content-['']",
        'hover:after:bg-border-strong data-dragging:after:w-0.5 data-dragging:after:bg-primary',
        'focus-visible:after:w-0.5 focus-visible:after:bg-focus-ring',
      )}
    />
  );
}
