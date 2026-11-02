import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import {
  batchOffsets,
  offsetPolyline,
  polylineLength,
  slicePolyline,
  toPathData,
} from './pipeline-geometry';
import type { Batch, Point } from './pipeline-model';

/** How many products get their own look: 3 hues, then the same 3 striped. */
export const PRODUCT_SLOTS = 6;

const hueClasses = [
  'stroke-product-1',
  'stroke-product-2',
  'stroke-product-3',
] as const;

/**
 * The look for a product: its slot in `products` picks the hue (slot mod 3) and
 * whether it's striped (slots 4–6). Anything past 6, or not listed, is "other":
 * neutral gray, striped. Color follows the product, never its position in a pipe.
 */
export function productStyle(
  product: string,
  products: readonly string[],
): { colorClass: string; striped: boolean; slot: number | null } {
  const index = products.indexOf(product);
  if (index === -1 || index >= PRODUCT_SLOTS) {
    return { colorClass: 'stroke-line-neutral', striped: true, slot: null };
  }
  return {
    colorClass: hueClasses[index % 3] as string,
    striped: index >= 3,
    slot: index + 1,
  };
}

export type BatchTrainProps = Omit<
  ComponentProps<'g'>,
  'children' | 'points'
> & {
  /**
   * The pipe's points, upstream (`from`) first, in map grid units. The same points
   * the pipe is drawn from, so the band follows it around elbows.
   */
  points: readonly Point[];
  /** The batches in the pipe, **downstream-first** (`batches[0]` is nearest `to`). */
  batches: readonly Batch[];
  /**
   * Product codes in legend order. A product's position here picks its color, so
   * the same product looks the same on every pipe. Products 7+ (or unlisted) show
   * as "other".
   */
  products: readonly string[];
  /**
   * Map grid units per screen pixel (e.g. `12 / 480` for a 12-unit-wide map drawn
   * 480px wide). Lets the band sit a fixed number of **pixels** beside the pipe and
   * keep pixel-sized gaps, whatever the map's scale. The map works this out for you.
   */
  unitsPerPx: number;
  /**
   * Distance from the pipe's center line to the band's, in px. Positive is to the
   * left of the direction of flow (above a pipe drawn left to right).
   * @default 10
   */
  offsetPx?: number;
  /**
   * What a screen reader says for the whole train, e.g. "3 batches: B-1042 SYN
   * 5,000 m³, …". Without it the train is decorative (`aria-hidden`).
   */
  label?: string;
};

/** Gap between neighbouring batches, in px, so equal colors still read as two batches. */
const GAP_PX = 2;

/**
 * The batches inside one pipe, drawn as a thin band beside it: one colored piece per
 * batch, sized by its share of the linefill, oldest batch at the downstream end.
 * Render it inside an `<svg>`, next to the pipe's `PipeSegment`.
 *
 * Products are told apart by hue **and** stripes, never color alone. Each piece has
 * `data-batch` and `data-product`, for tooltips and tests.
 */
export function BatchTrain({
  points,
  batches,
  products,
  unitsPerPx,
  offsetPx = 10,
  label,
  className,
  ...props
}: BatchTrainProps) {
  const track = offsetPolyline(points, offsetPx * unitsPerPx);
  const length = polylineLength(track);
  // Half a gap off each inner end, as a fraction of the track's length.
  const halfGap = length > 0 ? (GAP_PX * unitsPerPx) / 2 / length : 0;
  const spans = batchOffsets(batches);

  return (
    <g
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
      className={cn('[--batch-w:4px]', className)}
    >
      {spans.map(({ batch, start, length: share }, i) => {
        const end = start + share;
        // Spans are downstream-first: i = 0 touches the `to` end (fraction 1).
        const piece = slicePolyline(
          track,
          i === spans.length - 1 ? start : start + halfGap,
          i === 0 ? end : end - halfGap,
        );
        if (piece.length < 2) return null;
        const d = toPathData(piece);
        const { colorClass, striped } = productStyle(batch.product, products);
        return (
          <g
            key={batch.name}
            data-batch={batch.name}
            data-product={batch.product}
          >
            <path
              d={d}
              fill="none"
              vectorEffect="non-scaling-stroke"
              className={cn('[stroke-width:var(--batch-w)]', colorClass)}
            />
            {striped && (
              // Stripes: short breaks in the page color (bg) through the middle of the band.
              <path
                d={d}
                fill="none"
                vectorEffect="non-scaling-stroke"
                data-stripes=""
                className="stroke-bg [stroke-dasharray:4_3] [stroke-width:calc(var(--batch-w)*0.5)]"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
