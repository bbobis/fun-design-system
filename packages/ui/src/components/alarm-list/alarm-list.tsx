import { useEffect, useRef, useState } from 'react';
import {
  Button as AriaButton,
  Checkbox as AriaCheckbox,
  GridList,
  GridListItem,
  type Selection,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Button } from '../button';
import { CheckboxBox } from '../checkbox-group/checkbox-group';
import { Menu, MenuItem } from '../menu';
import {
  ago,
  alarmName,
  isShelved,
  newAlarmMessage,
  sortAlarms,
  type Alarm,
  type AlarmPriority,
} from './alarm-model';

export type AlarmListProps = {
  /** Names the list ("Active alarms"). */
  'aria-label': string;
  /** All alarms. Shelved ones (until a future time) are counted, not listed. */
  alarms: readonly Alarm[];
  /** Acknowledge these ids (the row's Ack, or the toolbar). Update `alarms` after. */
  onAcknowledge: (ids: string[]) => void;
  /** Shelve these ids for so many minutes. Leave out to hide Shelve. */
  onShelve?: (ids: string[], minutes: number) => void;
  /** "Now", for ages ("3 min ago") and shelving. ISO date-time. @default the clock */
  now?: string;
  /** BCP 47 language for the exact times. */
  locale?: string;
  /** IANA zone for the exact times. @default the viewer's */
  timeZone?: string;
  className?: string;
};

/**
 * Shape + number per priority, so it never rests on color. Color fades with priority
 * (ISA-101: the urgent ones should be the loud ones). Each passes 3:1 on bg.
 */
const priorityColor: Record<AlarmPriority, string> = {
  1: 'text-danger', // ◆
  2: 'text-warning', // ▲
  3: 'text-fg', // ■
  4: 'text-fg-muted', // ●
};

const SHELVE_OPTIONS = [
  { minutes: 15, label: '15 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 480, label: '8 hours' },
] as const;

/**
 * A control-room alarm summary. Each row: priority as a shape **and** a number, the
 * tag, message, location and age. Unacknowledged alarms are bold with a solid
 * marker; cleared-but-unacknowledged ones stay (muted, "cleared") until someone
 * acknowledges them. No flashing: it's distracting, a seizure risk (WCAG 2.3.1), and
 * bold + marker + words already say "unacknowledged".
 *
 * Built on React Aria `GridList`: ↑/↓ rows, Space ticks, Ctrl/⌘+A ticks all, Escape
 * clears, ←/→ move to a row's Ack button. New alarms are announced: priority 1–2
 * right away (assertive), 3–4 politely.
 */
export function AlarmList({
  'aria-label': ariaLabel,
  alarms,
  onAcknowledge,
  onShelve,
  now,
  locale,
  timeZone,
  className,
}: AlarmListProps) {
  const nowMs = now ? Date.parse(now) : Date.now();
  const shown = sortAlarms(alarms.filter((a) => !isShelved(a, nowMs)));
  const shelvedCount = alarms.length - shown.length;
  const unacked = shown.filter((a) => !a.acknowledged);
  const [selected, setSelected] = useState<string[]>([]);
  // Only ids that are still shown count (an alarm may have gone).
  const ticked = selected.filter((id) => shown.some((a) => a.id === id));

  // Announce alarms that weren't there before (not on the first render).
  const seen = useRef<Set<string> | null>(null);
  const [urgent, setUrgent] = useState('');
  const [polite, setPolite] = useState('');
  useEffect(() => {
    const ids = new Set(alarms.map((a) => a.id));
    if (seen.current) {
      const fresh = alarms.filter((a) => !seen.current?.has(a.id));
      const high = fresh.filter((a) => a.priority <= 2);
      const low = fresh.filter((a) => a.priority > 2);
      if (high.length) setUrgent(high.map(newAlarmMessage).join('. '));
      if (low.length) setPolite(low.map(newAlarmMessage).join('. '));
    }
    seen.current = ids;
  }, [alarms]);

  const toIds = (keys: Selection) =>
    keys === 'all'
      ? shown.map((a) => a.id)
      : shown.map((a) => a.id).filter((id) => keys.has(id));

  // Toolbar targets: the ticked rows, or every unacknowledged one if none are ticked.
  const ackTargets = ticked.length
    ? ticked.filter((id) => unacked.some((a) => a.id === id))
    : unacked.map((a) => a.id);
  const shelveTargets = ticked.length ? ticked : [];

  const fmtExact = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-md border border-border bg-bg',
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label={`${ariaLabel} actions`}
        className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2"
      >
        <p className="me-auto text-sm text-fg-muted">
          <span className={cn(unacked.length && 'font-semibold text-fg')}>
            {unacked.length} unacknowledged
          </span>
          {' · '}
          {shown.length} shown
          {shelvedCount > 0 && <> · {shelvedCount} shelved</>}
        </p>
        <Button
          size="sm"
          intent={ackTargets.length ? 'primary' : 'secondary'}
          disabled={ackTargets.length === 0}
          onClick={() => {
            onAcknowledge(ackTargets);
            setSelected([]);
          }}
        >
          {ticked.length
            ? `Acknowledge ${ackTargets.length} selected`
            : 'Acknowledge all'}
        </Button>
        {onShelve && (
          <Menu
            label="Shelve"
            intent="secondary"
            size="sm"
            disabled={shelveTargets.length === 0}
            aria-label={
              shelveTargets.length
                ? `Shelve ${shelveTargets.length} selected`
                : 'Shelve (select alarms first)'
            }
          >
            {SHELVE_OPTIONS.map((o) => (
              <MenuItem
                key={o.minutes}
                onAction={() => {
                  onShelve(shelveTargets, o.minutes);
                  setSelected([]);
                }}
              >
                {`For ${o.label}`}
              </MenuItem>
            ))}
          </Menu>
        )}
      </div>

      <GridList
        aria-label={ariaLabel}
        items={shown}
        selectionMode="multiple"
        selectionBehavior="toggle"
        selectedKeys={ticked}
        onSelectionChange={(keys) => setSelected(toIds(keys))}
        renderEmptyState={() => (
          <p className="px-4 py-10 text-center text-sm text-fg-muted">
            No alarms. All clear.
          </p>
        )}
        className="flex flex-col divide-y divide-border overflow-auto text-sm outline-hidden data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
      >
        {(a) => {
          const color = priorityColor[a.priority];
          const unack = !a.acknowledged;
          const cleared = a.state === 'cleared';
          return (
            <GridListItem
              id={a.id}
              textValue={alarmName(a, nowMs)}
              className={cn(
                // group: CheckboxBox reads data-selected from the row.
                'group relative flex items-center gap-3 px-3 py-2 outline-hidden',
                'hover:bg-surface data-selected:bg-primary/10',
                // Unacknowledged: a solid bar on the start edge, in the priority color.
                unack &&
                  cn(
                    'before:absolute before:inset-y-0 before:start-0 before:w-1 before:bg-current',
                    color,
                  ),
                'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
              )}
            >
              <AriaCheckbox slot="selection" className="flex cursor-pointer">
                <CheckboxBox />
              </AriaCheckbox>
              <PriorityMark priority={a.priority} />
              <span
                className={cn(
                  'flex min-w-0 flex-1 flex-col gap-0.5 text-fg',
                  cleared && 'text-fg-muted',
                )}
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="shrink-0 font-mono text-xs">{a.tag}</span>
                  <span className={cn('truncate', unack && 'font-semibold')}>
                    {a.message}
                  </span>
                </span>
                <span className="flex flex-wrap gap-x-2 text-xs text-fg-muted">
                  {a.location && <span>{a.location}</span>}
                  {cleared && <span className="font-medium">Cleared</span>}
                  {unack && (
                    <span className="font-medium text-fg">Unacknowledged</span>
                  )}
                </span>
              </span>
              <time
                dateTime={a.raisedAt}
                title={fmtExact.format(new Date(a.raisedAt))}
                className={cn(
                  'shrink-0 text-xs whitespace-nowrap tabular-nums',
                  unack ? 'font-semibold text-fg' : 'text-fg-muted',
                )}
              >
                {ago(a.raisedAt, nowMs)}
              </time>
              {/* A real button inside the row: ←/→ move focus to it. */}
              {unack ? (
                <AriaButton
                  aria-label={`Acknowledge ${a.tag}`}
                  onPress={() => onAcknowledge([a.id])}
                  className="shrink-0 rounded-md border border-border-strong px-2 py-1 text-xs font-medium text-fg outline-hidden hover:bg-surface data-focus-visible:outline-2 data-focus-visible:outline-offset-1 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
                >
                  Ack
                </AriaButton>
              ) : (
                <span className="w-[2.6rem] shrink-0" aria-hidden="true" />
              )}
            </GridListItem>
          );
        }}
      </GridList>

      {/* Two live regions, always in the DOM: urgent (P1–P2) interrupts, the rest waits. */}
      <p role="alert" className="sr-only">
        {urgent}
      </p>
      <p role="status" className="sr-only">
        {polite}
      </p>
    </div>
  );
}

/** The priority shape with its number inside. Decorative: the row says "Priority 1". */
function PriorityMark({ priority }: { priority: AlarmPriority }) {
  const shape = {
    1: <path d="M10 1.5 18.5 10 10 18.5 1.5 10z" />,
    2: <path d="M10 1.75 18.75 17.75H1.25z" />,
    3: <path d="M2.75 2.75h14.5v14.5H2.75z" />,
    4: <circle cx="10" cy="10" r="8.25" />,
  }[priority];
  return (
    <span
      aria-hidden="true"
      className={cn('relative flex size-6 shrink-0', priorityColor[priority])}
    >
      <svg
        viewBox="0 0 20 20"
        fill="var(--color-bg)"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
        className="size-full"
      >
        {shape}
      </svg>
      {/* The number in text color: readable (4.5:1) whatever the shape's color. */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-[0.625rem] font-bold text-fg',
          priority === 2 && 'pt-1.5',
        )}
      >
        {priority}
      </span>
    </span>
  );
}
