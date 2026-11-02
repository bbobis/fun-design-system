import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import { cssVars } from '../../utils/css-vars';
import {
  DEFAULT_STROKE_RANGE,
  strokeWidthFor,
  type StrokeRange,
} from './pipeline-geometry';
import type { SegmentStatus } from './pipeline-model';

/**
 * How each status looks. Color **and** pattern, so status never depends on color alone
 * (WCAG 1.4.1). Dash sizes are multiples of the line width (`--pipe-w`), so a thick
 * dashed pipe and a thin one look like the same pattern.
 */
const statusClasses: Record<SegmentStatus, string> = {
  running: 'stroke-line-success',
  restricted:
    'stroke-line-warning [stroke-dasharray:calc(var(--pipe-w)*3)_calc(var(--pipe-w)*1.5)]',
  // A zero-length dash with a round cap draws a dot as wide as the line. A shut-down
  // pipe has no flow to show, so its dots get a 4px minimum: at 2px they read as a hairline.
  shutdown:
    'stroke-line-neutral [stroke-linecap:round] [stroke-width:max(var(--pipe-w),4px)] [stroke-dasharray:0_calc(max(var(--pipe-w),4px)*2.5)]',
};

export type PipeSegmentProps = Omit<
  ComponentProps<'path'>,
  'd' | 'strokeWidth' | 'children'
> & {
  /** SVG path data for the pipe, in map grid units. Build it with the map's geometry. */
  d: string;
  /**
   * Running = solid green, restricted = dashed orange, shutdown = dotted gray.
   */
  status: SegmentStatus;
  /** Current flow, in m³/h. Sets the line width with `maxFlowRate`. */
  flowRate: number;
  /** The segment's normal maximum flow, in m³/h. A pipe at this rate draws at `strokeRange.max`. */
  maxFlowRate: number;
  /**
   * Thinnest and thickest line, in screen pixels.
   * @default { min: 2, max: 10 }
   */
  strokeRange?: StrokeRange;
  /**
   * What a screen reader says for this pipe, e.g. "Terminal A to Station B, running,
   * 1,200 m³/h". Without it the pipe is decorative (`aria-hidden`): use that when a
   * parent (the map, or a table next to it) already describes the segment.
   */
  label?: string;
};

/**
 * One pipe on a Pipeline Map: an SVG `<path>` whose width shows flow and whose color
 * and pattern show status. Render it inside an `<svg>`.
 *
 * The line keeps the same width on screen however the map is scaled
 * (`vector-effect: non-scaling-stroke`), so line width always means flow, not zoom.
 *
 * Not focusable on its own: keyboard access belongs to the map, which moves focus
 * between segments and facilities.
 */
export function PipeSegment({
  d,
  status,
  flowRate,
  maxFlowRate,
  strokeRange = DEFAULT_STROKE_RANGE,
  label,
  className,
  ...props
}: PipeSegmentProps) {
  const width = strokeWidthFor(flowRate, maxFlowRate, strokeRange);
  return (
    <path
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
      d={d}
      fill="none"
      vectorEffect="non-scaling-stroke"
      data-status={status}
      // The one runtime number: line width. A CSS variable through cssVars (rule 13).
      style={cssVars({ '--pipe-w': `${width}px` })}
      className={cn(
        '[stroke-linejoin:round] [stroke-width:var(--pipe-w)]',
        statusClasses[status],
        className,
      )}
    />
  );
}
