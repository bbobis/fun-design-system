import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { BatchTrain, PRODUCT_SLOTS } from './batch-train';
import { FACILITY_KIND_LABELS, FacilityKindMarker } from './facility-node';
import { PipeSegment } from './pipe-segment';
import type { FacilityKind, SegmentStatus } from './pipeline-model';

/** A product code that is never in the list, so `BatchTrain` draws it as "other". */
const UNLISTED_PRODUCT = '__other__';

const STATUSES: SegmentStatus[] = ['running', 'restricted', 'shutdown'];
const KINDS = Object.keys(FACILITY_KIND_LABELS) as FacilityKind[];

/** A short line swatch, 36 × 12 px. Children are drawn in px (no viewBox scaling). */
function LineSwatch({ children }: { children: ReactNode }) {
  return (
    <svg
      width={36}
      height={12}
      viewBox="0 0 36 12"
      aria-hidden
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

/** One titled list in the legend. The title names the list for screen readers. */
function LegendGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <p id={id} className="text-xs font-medium text-fg-muted">
        {title}
      </p>
      <ul aria-labelledby={id} className="flex flex-col gap-1">
        {children}
      </ul>
    </div>
  );
}

function LegendItem({
  swatch,
  children,
}: {
  swatch: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      {swatch}
      <span>{children}</span>
    </li>
  );
}

export type MapLegendProps = Omit<ComponentProps<'section'>, 'children'> & {
  /** The same product list (and order) you pass to `PipelineMap`, so colors match. */
  products: readonly string[];
  /** Optional readable names: `{ SYN: 'Synthetic crude' }` shows "SYN · Synthetic crude". */
  productNames?: Readonly<Record<string, string>>;
};

/**
 * The key to a Pipeline Map: product looks, pipe statuses, what line width means,
 * and the facility shapes. Swatches are drawn by the map's own pieces (`BatchTrain`,
 * `PipeSegment`, `FacilityKindMarker`), so the legend can't drift from the map.
 *
 * Plain HTML lists with a title each, so screen readers can skim it; the swatches
 * are hidden from them (the words carry the meaning).
 */
export function MapLegend({
  products,
  productNames,
  className,
  'aria-label': ariaLabel = 'Map legend',
  ...props
}: MapLegendProps) {
  const shown = products.slice(0, PRODUCT_SLOTS);
  const others = products.slice(PRODUCT_SLOTS);
  return (
    <section
      aria-label={ariaLabel}
      {...props}
      className={cn(
        'flex flex-wrap gap-x-10 gap-y-4 text-sm text-fg',
        className,
      )}
    >
      <LegendGroup title="Products">
        {shown.map((code) => (
          <LegendItem
            key={code}
            swatch={
              <LineSwatch>
                <BatchTrain
                  points={[
                    { x: 2, y: 6 },
                    { x: 34, y: 6 },
                  ]}
                  batches={[{ name: code, product: code, volume: 1 }]}
                  products={products}
                  unitsPerPx={1}
                  offsetPx={0}
                />
              </LineSwatch>
            }
          >
            {code}
            {productNames?.[code] && (
              <span className="text-fg-muted"> · {productNames[code]}</span>
            )}
          </LegendItem>
        ))}
        {others.length > 0 && (
          <LegendItem
            swatch={
              <LineSwatch>
                <BatchTrain
                  points={[
                    { x: 2, y: 6 },
                    { x: 34, y: 6 },
                  ]}
                  batches={[
                    { name: 'other', product: UNLISTED_PRODUCT, volume: 1 },
                  ]}
                  products={products}
                  unitsPerPx={1}
                  offsetPx={0}
                />
              </LineSwatch>
            }
          >
            Other <span className="text-fg-muted">· {others.join(', ')}</span>
          </LegendItem>
        )}
      </LegendGroup>

      <LegendGroup title="Pipe status">
        {STATUSES.map((status) => (
          <LegendItem
            key={status}
            swatch={
              <LineSwatch>
                <PipeSegment
                  d="M 3 6 L 33 6"
                  status={status}
                  // 4px wide, so a restricted dash (3× width) + gap fits twice in 30px.
                  flowRate={status === 'shutdown' ? 0 : 1}
                  maxFlowRate={4}
                />
              </LineSwatch>
            }
          >
            {status}
          </LegendItem>
        ))}
      </LegendGroup>

      <LegendGroup title="Line width">
        <LegendItem
          swatch={
            <LineSwatch>
              <PipeSegment
                d="M 3 6 L 33 6"
                status="running"
                flowRate={0}
                maxFlowRate={1}
              />
            </LineSwatch>
          }
        >
          low flow
        </LegendItem>
        <LegendItem
          swatch={
            <LineSwatch>
              <PipeSegment
                d="M 3 6 L 33 6"
                status="running"
                flowRate={1}
                maxFlowRate={1}
              />
            </LineSwatch>
          }
        >
          at max flow
        </LegendItem>
      </LegendGroup>

      <LegendGroup title="Facilities">
        {KINDS.map((kind) => (
          <LegendItem
            key={kind}
            swatch={
              <svg
                width={20}
                height={20}
                viewBox="-12 -12 24 24"
                aria-hidden
                className="shrink-0"
              >
                <FacilityKindMarker kind={kind} />
              </svg>
            }
          >
            {FACILITY_KIND_LABELS[kind]}
          </LegendItem>
        ))}
      </LegendGroup>
    </section>
  );
}
