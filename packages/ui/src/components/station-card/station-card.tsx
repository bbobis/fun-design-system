import { useId } from 'react';
import { cn } from '../../utils/cn';
import type { Alarm, AlarmPriority } from '../alarm-list/alarm-model';
import { isShelved } from '../alarm-list/alarm-model';
import { PriorityMark } from '../alarm-list/priority-mark';
import { Card, CardBody, CardHeader, CardLink } from '../card';
import { EquipmentStatus } from '../equipment-status';
import { Gauge, type GaugeProps } from '../gauge';
import type { HeadingLevel } from '../heading';
import {
  sortEquipment,
  stationHealth,
  type StationEquipment,
  type StationHealthLevel,
} from './station-health';

export type StationCardProps = {
  /** The station's name ("Station B"). The card's title, and the link's name. */
  name: string;
  /** A muted line under the name: location, kilometre post, line. */
  description?: string;
  /** The station's own page. Makes the whole card clickable. */
  href?: string;
  /** The station's equipment. Worst state first; the first `maxEquipment` are shown. */
  equipment: readonly StationEquipment[];
  /** 0–3 key readings, shown as small Gauges (`size` is set for you). */
  readings?: readonly Omit<GaugeProps, 'size' | 'orientation'>[];
  /** The station's alarms. Shelved ones are left out of the counts. */
  alarms?: readonly Alarm[];
  /** "Now" in ms, for time in state and shelving. Use one clock for every card. @default Date.now() */
  now?: number;
  /** How many equipment items to list before "+N more". @default 4 */
  maxEquipment?: number;
  /** The title's heading level, to fit the page outline. @default 3 */
  headingLevel?: HeadingLevel;
  className?: string;
};

/**
 * The colour stripe on the start edge. It backs up the health *words* under the
 * title; it never carries the meaning alone. Gray for normal (ISA-101).
 */
const stripe: Record<StationHealthLevel, string> = {
  normal: 'bg-border-strong',
  attention: 'bg-warning',
  abnormal: 'bg-danger',
};

const healthText: Record<StationHealthLevel, string> = {
  normal: 'text-fg-muted',
  attention: 'text-fg-warning',
  abnormal: 'text-fg-danger',
};

const PRIORITIES: AlarmPriority[] = [1, 2, 3, 4];

/**
 * One pump station at a glance, for an overview of many: a health line that rolls up
 * the equipment and alarms ("Abnormal: 1 fault · 2 active alarms"), the equipment as
 * status icons (worst first), 0–3 small gauges, and active alarm counts by priority.
 *
 * With `href`, the whole card is a link named just "Station B" (short to Tab
 * through); the health line is attached as its *description* (`aria-describedby`),
 * so a screen reader hears "Station B, link, Abnormal: 1 fault…".
 *
 * @example
 * <StationCard name="Station B" href="/stations/b" equipment={eq} alarms={alarms} now={now} />
 */
export function StationCard({
  name,
  description,
  href,
  equipment,
  readings = [],
  alarms = [],
  now = Date.now(),
  maxEquipment = 4,
  headingLevel = 3,
  className,
}: StationCardProps) {
  const titleId = useId();
  const healthId = useId();
  const health = stationHealth(equipment, alarms, now);

  const sorted = sortEquipment(equipment);
  const shown = sorted.slice(0, maxEquipment);
  const hidden = sorted.length - shown.length;

  const active = alarms.filter(
    (a) => a.state === 'active' && !isShelved(a, now),
  );
  const counts = PRIORITIES.map((p) => ({
    priority: p,
    n: active.filter((a) => a.priority === p).length,
  })).filter((c) => c.n > 0);

  return (
    <Card
      as="article"
      aria-labelledby={titleId}
      // overflow-hidden clips the stripe to the rounded corners; the focus outline
      // is drawn outside the box, so it isn't clipped.
      className={cn('relative overflow-hidden ps-6', className)}
    >
      <CardHeader
        headingLevel={headingLevel}
        titleId={titleId}
        title={
          href ? (
            <CardLink href={href} aria-describedby={healthId}>
              {name}
            </CardLink>
          ) : (
            name
          )
        }
        description={description}
      />
      <CardBody className="flex flex-col gap-4">
        <p id={healthId} className="text-sm">
          <span className={cn('font-semibold', healthText[health.level])}>
            {health.word}:
          </span>{' '}
          <span className="text-fg">{health.summary}</span>
        </p>

        {shown.length > 0 && (
          <ul aria-label="Equipment" className="flex flex-wrap gap-x-4 gap-y-2">
            {shown.map((e) => (
              <li key={e.id} className="flex items-center gap-1.5 text-sm">
                {/* Not a Tab stop: the card is one. The icon is a named image
                    ("Pump 2: Fault, for 12 minutes"); the visible name is hidden
                    so it isn't read twice. */}
                <EquipmentStatus
                  variant="icon"
                  size="sm"
                  tooltip={false}
                  name={e.name}
                  status={e.status}
                  label={e.label}
                  since={e.since}
                  now={now}
                />
                <span aria-hidden="true" className="text-fg">
                  {e.name}
                </span>
              </li>
            ))}
            {hidden > 0 && (
              <li className="text-sm text-fg-muted">+{hidden} more</li>
            )}
          </ul>
        )}

        {readings.length > 0 && (
          <div className="grid gap-3">
            {readings.map((r) => (
              <Gauge key={r.label} {...r} size="sm" />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          {counts.length === 0 ? (
            <span className="text-fg-muted">No active alarms</span>
          ) : (
            <>
              <span className="text-fg-muted">Active alarms</span>
              <ul aria-label="Active alarms by priority" className="flex gap-3">
                {counts.map((c) => (
                  <li key={c.priority} className="flex items-center gap-1">
                    <PriorityMark priority={c.priority} className="size-5" />
                    <span aria-hidden="true" className="font-semibold text-fg">
                      {c.n}
                    </span>
                    <span className="sr-only">
                      Priority {c.priority}: {c.n}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </CardBody>
      {/* Last child: Card parts space themselves with not-first:mt-4, so a
          first-child stripe would push the header down. */}
      <span
        aria-hidden="true"
        data-health={health.level}
        className={cn('absolute inset-y-0 start-0 w-1.5', stripe[health.level])}
      />
    </Card>
  );
}
