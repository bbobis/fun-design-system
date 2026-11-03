import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SVGProps,
} from 'react';
import { cn } from '../../utils/cn';
import { cssVars } from '../../utils/css-vars';
import { productStyle } from '../pipeline-map/batch-train';
import {
  assignLanes,
  barPosition,
  dayBoundaries,
  moveFocus,
  type BatchStatus,
  type Move,
  type ScheduledBatch,
  type ScheduleLine,
} from './schedule-model';

export type BatchScheduleProps = {
  /** Names the schedule ("Line 1 injection schedule"). */
  'aria-label': string;
  /** The rows, top to bottom. */
  lines: readonly ScheduleLine[];
  /** All batches; each one's `line` says which row it's on. */
  batches: readonly ScheduledBatch[];
  /**
   * Product codes in legend order, the same list the Pipeline Map gets: the first
   * three get the three product hues, the next three the same hues striped.
   */
  products: readonly string[];
  /** First day shown, `'YYYY-MM-DD'`, in `timeZone`. */
  from: string;
  /** How many days to show. @default 7 */
  days?: number;
  /**
   * IANA time zone for day columns and times ("America/Edmonton"). Use the control
   * room's zone so everyone sees the same days. @default the viewer's own zone
   */
  timeZone?: string;
  /** Draws a "Now" line at this moment (ISO date-time). Leave out for no line. */
  now?: string;
  /** Called when a batch is clicked or gets Enter: open its details. */
  onBatchAction?: (batch: ScheduledBatch) => void;
  /** BCP 47 language for dates and numbers. @default the viewer's */
  locale?: string;
  className?: string;
};

/** Static class tables: Tailwind only sees class names written out in full. */
const hue = [
  'border-s-product-1 [--tint:var(--color-product-1)]',
  'border-s-product-2 [--tint:var(--color-product-2)]',
  'border-s-product-3 [--tint:var(--color-product-3)]',
] as const;
const OTHER = 'border-s-line-neutral [--tint:var(--color-line-neutral)]';

const statusClass: Record<BatchStatus, string> = {
  // Not started yet: dashed outline, lighter fill.
  // Dashed on top, bottom and end only: the start edge stays the solid product color.
  planned:
    'border-y border-e border-y-border-strong border-e-border-strong [border-block-style:dashed] [border-inline-end-style:dashed]',
  active: '',
  complete: 'text-fg-muted',
  // A red ring (on top of the product's start edge) plus an icon: not color alone.
  'at-risk': 'ring-2 ring-danger ring-inset',
};
const statusWord: Record<BatchStatus, string> = {
  planned: 'planned',
  active: 'in the line',
  complete: 'complete',
  'at-risk': 'at risk',
};

/** One lane is 2.5rem tall (a 2rem bar + 0.25rem above and below). */
const LANE_REM = 2.5;

/**
 * A batch schedule: one row per line (or line segment), batches as bars across the
 * days. Same product colors and stripes as the Pipeline Map, a "Now" line, and bars
 * cut at the edges show they continue. Overlapping batches on one line get their own
 * lanes.
 *
 * Keyboard: one Tab stop (roving tabindex). ←/→ previous / next batch on the line,
 * ↑/↓ the batch closest in time on the line above / below, Home/End the first / last
 * on the line, Enter or Space opens it (`onBatchAction`).
 */
export function BatchSchedule({
  'aria-label': ariaLabel,
  lines,
  batches,
  products,
  from,
  days = 7,
  timeZone,
  now,
  onBatchAction,
  locale,
  className,
}: BatchScheduleProps) {
  const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const ids = useId();
  const bounds = useMemo(
    () => dayBoundaries(from, days, zone),
    [from, days, zone],
  );
  const windowStart = bounds[0] ?? 0;
  const windowEnd = bounds[bounds.length - 1] ?? 0;

  // Rows in display order, each with its visible batches sorted by start.
  const rows = useMemo(
    () =>
      lines.map((line) =>
        batches
          .filter(
            (b) =>
              b.line === line.id &&
              barPosition(
                Date.parse(b.start),
                Date.parse(b.end),
                windowStart,
                windowEnd,
              ) !== null,
          )
          .sort((x, y) => Date.parse(x.start) - Date.parse(y.start)),
      ),
    [lines, batches, windowStart, windowEnd],
  );

  // Roving tabindex: the batch that gets Tab. Start at the first batch that isn't
  // finished yet (where attention is), else the first batch.
  const all = rows.flat();
  const [focusId, setFocusId] = useState<string | null>(null);
  const tabId =
    (focusId && all.some((b) => b.id === focusId) ? focusId : null) ??
    (all.find((b) => b.status !== 'complete') ?? all[0])?.id ??
    null;
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const fmtTime = new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const fmtDay = new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const fmtVolume = new Intl.NumberFormat(locale);

  const keys: Record<string, Move> = {
    ArrowLeft: 'prev',
    ArrowRight: 'next',
    ArrowUp: 'up',
    ArrowDown: 'down',
    Home: 'first',
    End: 'last',
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const move = keys[e.key];
    if (!move) return;
    e.preventDefault(); // arrows would scroll the page
    const next = moveFocus(rows, id, move);
    setFocusId(next);
    const el = buttons.current.get(next);
    el?.focus();
    // Bring it into view inside the horizontal scroller (and the page).
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  const nowMs = now ? Date.parse(now) : undefined;
  const nowPos =
    nowMs !== undefined && nowMs >= windowStart && nowMs <= windowEnd
      ? ((nowMs - windowStart) / (windowEnd - windowStart)) * 100
      : undefined;

  const hintId = `${ids}-hint`;

  return (
    <section
      aria-label={ariaLabel}
      aria-describedby={hintId}
      className={cn('rounded-md border border-border bg-bg', className)}
    >
      <p id={hintId} className="sr-only">
        Arrow keys move between batches: left and right along a line, up and
        down to the next line. Enter opens a batch.
      </p>
      {/*
        Scrolls sideways when the days don't fit. Each day gets at least 8rem; the
        label column (10rem) stays pinned on the left (sticky), and scroll-padding
        keeps a focused bar from hiding under it.
      */}
      <div className="scroll-ps-40 overflow-x-auto">
        <div
          style={cssVars({ '--days': days })}
          className="min-w-[calc(var(--days)*8rem+10rem)]"
        >
          {/* Day header. aria-hidden: each bar already says its dates in words. */}
          <div aria-hidden="true" className="flex border-b border-border">
            <div className="sticky start-0 z-20 w-40 shrink-0 border-e border-border bg-bg" />
            <div className="relative h-9 flex-1">
              {bounds.slice(0, -1).map((start, i) => {
                const end = bounds[i + 1] ?? start;
                const left =
                  ((start - windowStart) / (windowEnd - windowStart)) * 100;
                const width = ((end - start) / (windowEnd - windowStart)) * 100;
                return (
                  <div
                    key={start}
                    style={cssVars({ '--l': `${left}%`, '--w': `${width}%` })}
                    className="absolute inset-y-0 start-(--l) flex w-(--w) items-center border-s border-border px-2 text-xs font-medium text-fg-muted first:border-s-0"
                  >
                    {fmtDay.format(new Date(start))}
                  </div>
                );
              })}
              {nowPos !== undefined && (
                <div
                  style={cssVars({ '--l': `${nowPos}%` })}
                  className="absolute bottom-0 start-(--l) z-10 -translate-x-1/2 rounded-t bg-danger px-1 text-[0.625rem] font-semibold text-on-danger rtl:translate-x-1/2"
                >
                  Now
                </div>
              )}
            </div>
          </div>

          {lines.map((line, r) => {
            const row = rows[r] ?? [];
            const { lanes, count } = assignLanes(row);
            const labelId = `${ids}-line-${r}`;
            return (
              <div
                key={line.id}
                role="group"
                aria-labelledby={labelId}
                className="flex border-b border-border last:border-b-0"
              >
                <div
                  id={labelId}
                  className="sticky start-0 z-20 flex w-40 shrink-0 items-center border-e border-border bg-bg px-3 text-sm font-medium"
                >
                  {line.label}
                </div>
                <div
                  style={cssVars({ '--rows': count })}
                  className="relative min-h-10 flex-1 [height:calc(var(--rows)*2.5rem)]"
                >
                  {/* Day lines behind the bars. */}
                  {bounds.slice(1, -1).map((t) => (
                    <div
                      key={t}
                      aria-hidden="true"
                      style={cssVars({
                        '--l': `${((t - windowStart) / (windowEnd - windowStart)) * 100}%`,
                      })}
                      className="absolute inset-y-0 start-(--l) border-s border-border"
                    />
                  ))}
                  {nowPos !== undefined && (
                    <div
                      aria-hidden="true"
                      style={cssVars({ '--l': `${nowPos}%` })}
                      // Behind the bars (earlier in the DOM, no z-index): it shows in
                      // the gaps and the header, and never cuts through a batch name.
                      className="absolute inset-y-0 start-(--l) border-s-2 border-danger"
                    />
                  )}
                  {row.length === 0 && (
                    <p className="flex h-full items-center px-3 text-xs text-fg-muted">
                      No batches in these days
                    </p>
                  )}
                  {row.map((b) => {
                    const pos = barPosition(
                      Date.parse(b.start),
                      Date.parse(b.end),
                      windowStart,
                      windowEnd,
                    );
                    if (!pos) return null;
                    const status = b.status ?? 'planned';
                    const style = productStyle(b.product, products);
                    const hueClass =
                      style.slot === null ? OTHER : hue[(style.slot - 1) % 3];
                    const name = [
                      b.name,
                      b.product,
                      line.label,
                      `${fmtTime.format(new Date(b.start))} to ${fmtTime.format(new Date(b.end))}`,
                      b.volume !== undefined
                        ? `${fmtVolume.format(b.volume)} m³`
                        : null,
                      statusWord[status],
                    ]
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <button
                        key={b.id}
                        ref={(el) => {
                          if (el) buttons.current.set(b.id, el);
                          else buttons.current.delete(b.id);
                        }}
                        type="button"
                        aria-label={name}
                        tabIndex={b.id === tabId ? 0 : -1}
                        onFocus={() => setFocusId(b.id)}
                        onKeyDown={(e) => onKeyDown(e, b.id)}
                        onClick={() => onBatchAction?.(b)}
                        style={cssVars({
                          '--l': `${pos.left}%`,
                          '--w': `${pos.width}%`,
                          '--lane': (lanes.get(b.id) ?? 0) * LANE_REM,
                        })}
                        className={cn(
                          'absolute start-(--l) top-[calc(var(--lane)*1rem+0.25rem)] z-0 flex h-8 w-(--w) min-w-1 items-center gap-1 overflow-hidden px-1.5 text-start text-xs font-medium text-fg',
                          // Tinted fill + a solid start edge in the product color.
                          'border-s-4 bg-[color-mix(in_oklab,var(--tint)_18%,var(--color-bg))]',
                          style.striped &&
                            'bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--tint)_28%,var(--color-bg))_0_4px,color-mix(in_oklab,var(--tint)_10%,var(--color-bg))_4px_8px)]',
                          hueClass,
                          // Rounded only where the batch really starts / ends.
                          !pos.cutStart && 'rounded-s',
                          !pos.cutEnd && 'rounded-e',
                          pos.cutStart && 'border-s-0 ps-0.5',
                          statusClass[status],
                          'hover:z-10 hover:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-focus-ring',
                        )}
                      >
                        {pos.cutStart && (
                          <ChevronIcon className="size-3 shrink-0 rotate-180 rtl:rotate-0" />
                        )}
                        {status === 'at-risk' && (
                          <AlertIcon className="size-3.5 shrink-0 text-fg-danger" />
                        )}
                        <span className="truncate">{b.name}</span>
                        <span className="truncate font-normal text-fg-muted">
                          {b.product}
                        </span>
                        {pos.cutEnd && (
                          <ChevronIcon className="ms-auto size-3 shrink-0 rtl:rotate-180" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}
const ChevronIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m6 4 4 4-4 4" />
  </Svg>
);
const AlertIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={1.5}>
    <path d="M8 2.25 1.75 13.25h12.5z" />
    <path d="M8 6.75v3M8 11.5h.01" />
  </Svg>
);
