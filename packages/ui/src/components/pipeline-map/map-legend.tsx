import { useId, type ComponentProps, type ReactNode } from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  type Key,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Button } from '../button/button';
import { BatchTrain, PRODUCT_SLOTS } from './batch-train';
import { FACILITY_KIND_LABELS, FacilityKindMarker } from './facility-node';
import { PipeSegment } from './pipe-segment';
import { isFilterActive, type MapFilter } from './pipeline-filter';
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

/** A pipe status as a short line: color and pattern, like on the map. */
function StatusSwatch({ status }: { status: SegmentStatus }) {
  return (
    <LineSwatch>
      <PipeSegment
        d="M 3 6 L 33 6"
        status={status}
        // 4px wide, so a restricted dash (3× width) + gap fits twice in 30px.
        flowRate={status === 'shutdown' ? 0 : 1}
        maxFlowRate={4}
      />
    </LineSwatch>
  );
}

/** One titled list in the legend. The title names the list for screen readers. */
function LegendGroup({
  title,
  children,
}: {
  title: string;
  /** The list items, or a function given the title's id (to label a toggle group). */
  children: ReactNode | ((titleId: string) => ReactNode);
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <p id={id} className="text-xs font-medium text-fg-muted">
        {title}
      </p>
      {typeof children === 'function' ? (
        children(id)
      ) : (
        <ul aria-labelledby={id} className="flex flex-col gap-1">
          {children}
        </ul>
      )}
    </div>
  );
}

/** A row that toggles a filter: swatch, words, and a check mark when on. */
function FilterToggle({
  id,
  swatch,
  children,
}: {
  id: string;
  swatch: ReactNode;
  children: ReactNode;
}) {
  return (
    <ToggleButton
      id={id}
      className={cn(
        '-mx-1.5 flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-0.5 text-start',
        'hover:bg-surface data-selected:bg-primary/10',
        'outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-focus-ring data-focus-visible:outline-solid',
      )}
    >
      {({ isSelected }) => (
        <>
          {swatch}
          <span className={cn(isSelected && 'font-semibold')}>{children}</span>
          {/* "On" is never color alone: a check mark and bold text too. */}
          <svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            aria-hidden
            className={cn(
              'ml-auto shrink-0 fill-none stroke-fg [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]',
              !isSelected && 'invisible',
            )}
          >
            <path d="m2.5 6.5 2.25 2L9.5 3.5" />
          </svg>
        </>
      )}
    </ToggleButton>
  );
}

/** A vertical group of `FilterToggle`s, labelled by its legend title. */
function FilterGroup({
  titleId,
  selected,
  onChange,
  children,
}: {
  titleId: string;
  selected: readonly string[];
  onChange: (keys: Set<Key>) => void;
  children: ReactNode;
}) {
  return (
    <ToggleButtonGroup
      aria-labelledby={titleId}
      selectionMode="multiple"
      orientation="vertical"
      selectedKeys={selected}
      onSelectionChange={onChange}
      className="flex flex-col gap-0.5"
    >
      {children}
    </ToggleButtonGroup>
  );
}

/** The key for the "Other" row: it toggles every product past the sixth. */
const OTHER_KEY = '__other__';

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
  /** The current filter (controlled). Pass the same object to `PipelineMap`. */
  filter?: MapFilter;
  /**
   * Makes the Products and Pipe status rows into toggle buttons that build a filter.
   * Without it the legend is a plain key. "Other" toggles every product past the sixth.
   */
  onFilterChange?: (filter: MapFilter) => void;
};

/**
 * The key to a Pipeline Map: product looks, pipe statuses, what line width means,
 * and the facility shapes. Swatches are drawn by the map's own pieces (`BatchTrain`,
 * `PipeSegment`, `FacilityKindMarker`), so the legend can't drift from the map.
 *
 * Plain HTML lists with a title each, so screen readers can skim it; the swatches
 * are hidden from them (the words carry the meaning).
 *
 * **As filters:** pass `filter` + `onFilterChange` and the Products and Pipe status
 * rows become toggle buttons (two vertical toolbars: one Tab stop each, ↑/↓ move,
 * Space toggles). Keep the filter in page state and give it to `PipelineMap` too.
 */
export function MapLegend({
  products,
  productNames,
  filter,
  onFilterChange,
  className,
  'aria-label': ariaLabel = 'Map legend',
  ...props
}: MapLegendProps) {
  const shown = products.slice(0, PRODUCT_SLOTS);
  const others = products.slice(PRODUCT_SLOTS);
  const interactive = onFilterChange !== undefined;
  const on = new Set<string>(filter?.products ?? []);
  const selectedProducts = [
    ...shown.filter((code) => on.has(code)),
    ...(others.length > 0 && others.every((code) => on.has(code))
      ? [OTHER_KEY]
      : []),
  ];
  const setProducts = (keys: Set<Key>) =>
    onFilterChange?.({
      ...filter,
      products: [
        ...shown.filter((code) => keys.has(code)),
        ...(keys.has(OTHER_KEY) ? others : []),
      ],
    });
  const productSwatch = (product: string) => (
    <LineSwatch>
      <BatchTrain
        points={[
          { x: 2, y: 6 },
          { x: 34, y: 6 },
        ]}
        batches={[{ name: product, product, volume: 1 }]}
        products={products}
        unitsPerPx={1}
        offsetPx={0}
      />
    </LineSwatch>
  );
  /** The Products rows, the same in the plain and the filter legend. */
  const productRows = [
    ...shown.map((code) => ({
      id: code,
      swatch: productSwatch(code),
      text: (
        <>
          {code}
          {productNames?.[code] && (
            <span className="font-normal text-fg-muted">
              {' '}
              · {productNames[code]}
            </span>
          )}
        </>
      ),
    })),
    ...(others.length > 0
      ? [
          {
            id: OTHER_KEY,
            swatch: productSwatch(UNLISTED_PRODUCT),
            text: (
              <>
                Other{' '}
                <span className="font-normal text-fg-muted">
                  · {others.join(', ')}
                </span>
              </>
            ),
          },
        ]
      : []),
  ];
  const setStatuses = (keys: Set<Key>) =>
    onFilterChange?.({
      ...filter,
      statuses: STATUSES.filter((status) => keys.has(status)),
    });
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
        {interactive
          ? (titleId) => (
              <FilterGroup
                titleId={titleId}
                selected={selectedProducts}
                onChange={setProducts}
              >
                {productRows.map((row) => (
                  <FilterToggle key={row.id} id={row.id} swatch={row.swatch}>
                    {row.text}
                  </FilterToggle>
                ))}
              </FilterGroup>
            )
          : productRows.map((row) => (
              <LegendItem key={row.id} swatch={row.swatch}>
                {row.text}
              </LegendItem>
            ))}
      </LegendGroup>

      <LegendGroup title="Pipe status">
        {interactive
          ? (titleId) => (
              <FilterGroup
                titleId={titleId}
                selected={filter?.statuses ?? []}
                onChange={setStatuses}
              >
                {STATUSES.map((status) => (
                  <FilterToggle
                    key={status}
                    id={status}
                    swatch={<StatusSwatch status={status} />}
                  >
                    {status}
                  </FilterToggle>
                ))}
              </FilterGroup>
            )
          : STATUSES.map((status) => (
              <LegendItem
                key={status}
                swatch={<StatusSwatch status={status} />}
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

      {interactive && isFilterActive(filter) && (
        <Button
          intent="ghost"
          size="sm"
          className="self-start"
          onClick={() => onFilterChange({})}
        >
          Clear filters
        </Button>
      )}
    </section>
  );
}
