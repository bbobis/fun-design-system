import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../button/button';
import { FACILITY_KIND_LABELS } from './facility-node';
import type { Facility, PipelineNetwork, Segment } from './pipeline-model';
import { tankFill } from './tank-gauge';

const numberFormat = new Intl.NumberFormat();
const n = (value: number) => numberFormat.format(value);

/** The pipes into and out of a facility, in network order. */
export function connectedPipes(
  network: PipelineNetwork,
  facilityId: string,
): { incoming: Segment[]; outgoing: Segment[] } {
  return {
    incoming: network.segments.filter((s) => s.to === facilityId),
    outgoing: network.segments.filter((s) => s.from === facilityId),
  };
}

/** A toggle in a list: wash + bold when on (never color alone), like the table's. */
const listToggle = cn(
  '-mx-1 cursor-pointer rounded-sm px-1 text-start tabular-nums hover:bg-surface',
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring',
  'aria-pressed:bg-primary/10 aria-pressed:font-semibold',
);
/** A link-looking button that selects another item. */
const itemLink =
  'cursor-pointer rounded-sm text-start underline decoration-link-underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

/** One "term: value" row of the facts list. */
function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-fg-muted">{term}</dt>
      <dd className="min-w-0 tabular-nums">{children}</dd>
    </div>
  );
}

/** A titled sub-list (Tanks, Batches, Pipes in…). The title names the list. */
function Section({ title, children }: { title: string; children: ReactNode }) {
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

export type PipelineMapDetailsProps = Omit<
  ComponentProps<'aside'>,
  'children' | 'onSelect'
> & {
  /** The same network the map draws. */
  network: PipelineNetwork;
  /** The item to describe: pass the map's `selectedId`. `null` shows a hint. */
  selectedId: string | null;
  /** Makes connected pipes and facilities buttons that select them. */
  onSelect?: (id: string) => void;
  /** The map's `tracedId`, so the Trace button shows pressed. */
  tracedId?: string | null;
  /** Shows a "Trace flow" toggle. Wire to the map's `onTraceChange`. */
  onTraceChange?: (id: string | null) => void;
  /** The map's `followedBatch`, so that batch shows pressed. */
  followedBatch?: string | null;
  /** Makes each batch a toggle. Wire to the map's `onFollowBatchChange`. */
  onFollowBatch?: (name: string | null) => void;
  /**
   * Shows a "Show on map" button. Usually `(id) => mapRef.current?.focusItem(id)`:
   * the one action here that *should* move focus, because that's what it asks for.
   */
  onShowOnMap?: (id: string) => void;
  /**
   * Level of the item's heading, to fit your page outline.
   * @default 2
   */
  headingLevel?: 2 | 3 | 4;
  /**
   * Fill (0–1) that counts as a high tank.
   * @default 0.9
   */
  highLevel?: number;
};

/**
 * Everything about the selected facility or pipe, beside the map: its numbers,
 * tanks or batches, the pipes it connects to, and actions (trace, follow a batch,
 * show on map).
 *
 * An `<aside>` landmark (role `complementary`), **non-modal**: the map stays usable,
 * so with the map's `selectionFollowsFocus` the panel updates as you arrow around.
 * Buttons here never move focus on their own, except "Show on map". The app lays out
 * the map and the panel; this component doesn't know where it sits.
 */
export function PipelineMapDetails({
  network,
  selectedId,
  onSelect,
  tracedId = null,
  onTraceChange,
  followedBatch = null,
  onFollowBatch,
  onShowOnMap,
  headingLevel = 2,
  highLevel = 0.9,
  'aria-label': ariaLabel = 'Details',
  className,
  ...props
}: PipelineMapDetailsProps) {
  const Heading = `h${headingLevel}` as const;
  const facility = network.facilities.find((f) => f.id === selectedId);
  const segment = network.segments.find((s) => s.id === selectedId);
  const name = (id: string) =>
    network.facilities.find((f) => f.id === id)?.label ?? id;

  const linkTo = (id: string, text: string) =>
    onSelect ? (
      <button type="button" className={itemLink} onClick={() => onSelect(id)}>
        {text}
      </button>
    ) : (
      text
    );

  const actions = selectedId !== null && (onTraceChange || onShowOnMap) && (
    <div className="flex flex-wrap gap-2">
      {onTraceChange && (
        <Button
          size="sm"
          intent="outline"
          aria-pressed={tracedId === selectedId}
          className="aria-pressed:bg-primary/10"
          onClick={() =>
            onTraceChange(tracedId === selectedId ? null : selectedId)
          }
        >
          {/* Same label on and off (aria-pressed says the state); a check shows it. */}
          {tracedId === selectedId && <span aria-hidden>✓ </span>}
          Trace flow
        </Button>
      )}
      {onShowOnMap && (
        <Button
          size="sm"
          intent="ghost"
          onClick={() => onShowOnMap(selectedId)}
        >
          Show on map
        </Button>
      )}
    </div>
  );

  return (
    <aside
      aria-label={ariaLabel}
      {...props}
      className={cn('flex flex-col gap-4 text-sm text-fg', className)}
    >
      {facility ? (
        <FacilityBody
          facility={facility}
          network={network}
          Heading={Heading}
          actions={actions}
          linkTo={linkTo}
          name={name}
          highLevel={highLevel}
        />
      ) : segment ? (
        <>
          <Heading className="text-base font-semibold">
            {name(segment.from)} → {name(segment.to)}
          </Heading>
          <dl className="flex flex-col gap-1.5">
            <Fact term="Status">{segment.status}</Fact>
            <Fact term="Flow">
              {n(segment.flowRate)} of {n(segment.maxFlowRate)} m³/h
              {segment.maxFlowRate > 0 && (
                <span className="text-fg-muted">
                  {' '}
                  ({Math.round((segment.flowRate / segment.maxFlowRate) * 100)}
                  %)
                </span>
              )}
            </Fact>
            <Fact term="Line fill">
              {n(segment.batches.reduce((sum, b) => sum + b.volume, 0))} m³
            </Fact>
            <Fact term="From">{linkTo(segment.from, name(segment.from))}</Fact>
            <Fact term="To">{linkTo(segment.to, name(segment.to))}</Fact>
          </dl>
          {actions}
          <Section title="Batches, downstream first">
            {segment.batches.length === 0 ? (
              <li className="text-fg-muted">None</li>
            ) : (
              segment.batches.map((b) => {
                const text = `${b.name} · ${b.product} · ${n(b.volume)} m³`;
                const on = b.name === followedBatch;
                return (
                  <li key={b.name}>
                    {onFollowBatch ? (
                      <button
                        type="button"
                        aria-pressed={on}
                        className={listToggle}
                        onClick={() => onFollowBatch(on ? null : b.name)}
                      >
                        {text}
                      </button>
                    ) : (
                      text
                    )}
                  </li>
                );
              })
            )}
          </Section>
        </>
      ) : (
        <p className="text-fg-muted">
          Select a facility or pipe on the map to see its details.
        </p>
      )}
    </aside>
  );
}

function FacilityBody({
  facility,
  network,
  Heading,
  actions,
  linkTo,
  name,
  highLevel,
}: {
  facility: Facility;
  network: PipelineNetwork;
  Heading: 'h2' | 'h3' | 'h4';
  actions: ReactNode;
  linkTo: (id: string, text: string) => ReactNode;
  name: (id: string) => string;
  highLevel: number;
}) {
  const { incoming, outgoing } = connectedPipes(network, facility.id);
  const pipe = (s: Segment) => (
    <li key={s.id}>
      {linkTo(s.id, `${name(s.from)} → ${name(s.to)}`)}{' '}
      <span className="text-fg-muted">· {s.status}</span>
    </li>
  );
  return (
    <>
      <Heading className="text-base font-semibold">{facility.label}</Heading>
      <dl className="flex flex-col gap-1.5">
        <Fact term="Kind">{FACILITY_KIND_LABELS[facility.kind]}</Fact>
        <Fact term="Alert">
          {facility.alert ? (
            <span
              className={
                facility.alert.level === 'danger' ? 'text-fg-danger' : undefined
              }
            >
              <span className="font-medium">
                {facility.alert.level === 'danger' ? 'Danger' : 'Warning'}:
              </span>{' '}
              {facility.alert.message}
            </span>
          ) : (
            <span className="text-fg-muted">None</span>
          )}
        </Fact>
      </dl>
      {actions}
      {facility.tanks && facility.tanks.length > 0 && (
        <Section title="Tanks">
          {facility.tanks.map((t) => {
            const fill = tankFill(t);
            return (
              <li key={t.id} className="tabular-nums">
                {t.label} · {Math.round(fill * 100)}% · {n(t.volume)} of{' '}
                {n(t.capacity)} m³
                {/* "high" in words, not just a color. */}
                {fill >= highLevel && (
                  <span className="font-semibold text-fg-warning"> · high</span>
                )}
              </li>
            );
          })}
        </Section>
      )}
      <Section title="Pipes in">
        {incoming.length ? (
          incoming.map(pipe)
        ) : (
          <li className="text-fg-muted">None (a source)</li>
        )}
      </Section>
      <Section title="Pipes out">
        {outgoing.length ? (
          outgoing.map(pipe)
        ) : (
          <li className="text-fg-muted">None (end of the line)</li>
        )}
      </Section>
    </>
  );
}
