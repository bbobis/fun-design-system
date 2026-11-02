import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';

export type TimelineSize = 'sm' | 'md';
export type TimelineTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/** The list's size, read by every item (one prop on the list, not one per item). */
const TimelineSizeContext = createContext<TimelineSize>('md');

export type TimelineProps = ComponentProps<'ol'> & {
  /** `sm`: smaller markers and text, for side panels. @default 'md' */
  size?: TimelineSize;
};

/**
 * Things that happened, in order: an invoice's history, an activity feed, the steps
 * of a shipment. An ordered list (`<ol>`), because the order carries meaning: screen
 * readers say "list, 5 items" and can jump item by item.
 *
 * Not interactive by itself. Put links or buttons inside an item when needed. Give the
 * list a name with `aria-label` (or `aria-labelledby` a heading) when the page has
 * more than one.
 *
 * @example
 * <Timeline aria-label="INV-1044 history">
 *   <TimelineItem tone="success" title="Payment received" time="2026-10-14T09:32:00Z" />
 *   <TimelineItem title="Invoice sent" time="2026-10-02" />
 * </Timeline>
 */
export function Timeline({
  size = 'md',
  className,
  children,
  ...rest
}: TimelineProps) {
  return (
    <TimelineSizeContext.Provider value={size}>
      <ol {...rest} className={cn('flex flex-col', className)}>
        {children}
      </ol>
    </TimelineSizeContext.Provider>
  );
}

export type TimelineItemProps = Omit<ComponentProps<'li'>, 'title'> & {
  /** What happened: "Payment received", or after an `actor`, "sent the invoice". */
  title: ReactNode;
  /** Who did it, in bold before the title ("**Dana Smith** sent the invoice"). */
  actor?: string;
  /**
   * When, as ISO text: a date (`'2026-10-14'`) or a date and time
   * (`'2026-10-14T09:32:00Z'`). Goes into `<time dateTime>` as is, and is shown
   * formatted for the user's language unless you pass `timeLabel`.
   */
  time?: string;
  /** Your own text for the time ("2 hours ago", "Yesterday"). `time` still goes in `dateTime`. */
  timeLabel?: string;
  /** Colour of the default marker. The title must say the meaning too. @default 'neutral' */
  tone?: TimelineTone;
  /**
   * Replaces the dot: an icon, or `<Avatar size="xs" decorative />`. Decoration: hidden
   * from screen readers, so the title has to say everything.
   */
  marker?: ReactNode;
  /**
   * Hasn't happened yet ("Payment due"). Hollow marker, dashed line, muted text, and
   * ", upcoming" for screen readers, since the style alone doesn't reach them.
   * @default false
   */
  upcoming?: boolean;
  /** Details under the title: an amount, a comment, a link. */
  children?: ReactNode;
};

const markerTone: Record<TimelineTone, string> = {
  neutral: 'bg-surface text-fg-muted',
  info: 'bg-info-soft text-on-info-soft',
  success: 'bg-success-soft text-on-success-soft',
  warning: 'bg-warning-soft text-on-warning-soft',
  danger: 'bg-danger-soft text-on-danger-soft',
};

/** Static tables per size (Tailwind only sees class names written out in full). */
const markerSize: Record<TimelineSize, string> = {
  sm: 'size-5 [&_svg]:size-3',
  md: 'size-6 [&_svg]:size-3.5',
};
const dotSize: Record<TimelineSize, string> = { sm: 'size-1.5', md: 'size-2' };
const textSize: Record<TimelineSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
};
/** Space below each item's text: the line between markers runs through it. */
const gapBelow: Record<TimelineSize, string> = { sm: 'pb-4', md: 'pb-6' };

/** One event in a Timeline. */
export function TimelineItem({
  title,
  actor,
  time,
  timeLabel,
  tone = 'neutral',
  marker,
  upcoming = false,
  children,
  className,
  ...rest
}: TimelineItemProps) {
  const size = useContext(TimelineSizeContext);
  return (
    <li {...rest} className={cn('group/item flex gap-3', className)}>
      {/*
        The marker and the line under it, in one column. A flex column (not an
        absolutely placed line) keeps the line centred under the marker in
        right-to-left pages too, and it grows with the item's height on its own.
      */}
      <div aria-hidden="true" className="flex shrink-0 flex-col items-center">
        <span
          className={cn(
            'flex items-center justify-center overflow-hidden rounded-full',
            markerSize[size],
            upcoming
              ? 'border border-dashed border-border-strong bg-bg text-fg-muted'
              : markerTone[tone],
          )}
        >
          {marker ??
            (upcoming ? null : (
              <span className={cn('rounded-full bg-current', dotSize[size])} />
            ))}
        </span>
        {/* The line down to the next item. The last item has none. */}
        <span
          className={cn(
            'mt-1 w-0 flex-1 border-s group-last/item:hidden',
            upcoming ? 'border-dashed border-border-strong' : 'border-border',
          )}
        />
      </div>
      <div
        className={cn(
          'min-w-0 flex-1 group-last/item:pb-0',
          // pt-0.5 lines the title's first line up with the marker's centre.
          'pt-0.5',
          gapBelow[size],
          textSize[size],
        )}
      >
        <p className={cn(upcoming ? 'text-fg-muted' : 'text-fg')}>
          {actor && <span className="font-semibold">{actor} </span>}
          <span className={cn(!actor && 'font-medium')}>{title}</span>
          {/* Leading comma: a leading space would be trimmed from what's read. */}
          {upcoming && <span className="sr-only">, upcoming</span>}
        </p>
        {time && (
          <time dateTime={time} className="text-xs text-fg-muted">
            {timeLabel ?? formatTime(time)}
          </time>
        )}
        {children && <div className="mt-1.5 text-fg-muted">{children}</div>}
      </div>
    </li>
  );
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * "Oct 14, 2026" or "Oct 14, 2026, 9:32 AM", in the user's language and time zone.
 *
 * A date with no time is a calendar day, not a moment: JavaScript reads
 * `new Date('2026-10-14')` as midnight **UTC**, which is still the 13th in the
 * Americas. So a date-only value is formatted in UTC, and stays the 14th everywhere.
 */
export function formatTime(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (DATE_ONLY.test(iso)) {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(date);
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
