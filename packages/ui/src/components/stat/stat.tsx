import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
  type SVGProps,
} from 'react';
import { cn } from '../../utils/cn';
import { Skeleton } from '../skeleton';

export type StatSize = 'sm' | 'md' | 'lg';

/** True inside a StatGroup: the group is the `<dl>`, so a Stat is just a row of it. */
const InGroupContext = createContext(false);

export type StatGroupProps = ComponentProps<'dl'>;

/**
 * A row (or grid) of Stats: one `<dl>`, each Stat a label (`<dt>`) and value (`<dd>`)
 * pair inside it. Lay it out with classes (`grid grid-cols-4 gap-4`), or put each
 * Stat in a Bento tile instead and skip the group.
 */
export function StatGroup({ className, children, ...rest }: StatGroupProps) {
  return (
    <InGroupContext.Provider value>
      <dl {...rest} className={cn('grid gap-4', className)}>
        {children}
      </dl>
    </InGroupContext.Provider>
  );
}

export type StatProps = {
  /** What the number is: "Revenue this month". */
  label: ReactNode;
  /** The number itself, raw (`84210`, not `'$84,210'`). `format` turns it into text. */
  value: number;
  /**
   * How to show numbers, for `Intl.NumberFormat`: currency, percent, compact ("1.2M")…
   * @example { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }
   */
  format?: Intl.NumberFormatOptions;
  /** BCP 47 language for formatting ("fr-CA"). Leave out to use the reader's. */
  locale?: string;
  /** Last period's value. The change ("+12.0%") is worked out from it. */
  previous?: number;
  /** "vs September", "vs last week": what the change is compared to. */
  period?: string;
  /**
   * Which direction is good news. `up` for revenue (a rise is green), `down` for
   * overdue invoices or churn (a fall is green). @default 'up'
   */
  goodWhen?: 'up' | 'down';
  /** A small trend line under the number: the last few values, oldest first. */
  sparkline?: readonly number[];
  /**
   * Makes the sparkline an image with this name ("Revenue, last 6 months: from 61k
   * to 84k"). Without it the line is decoration: the change already says the trend.
   */
  sparklineLabel?: string;
  /** Extra line under the value ("41 invoices paid"). */
  hint?: ReactNode;
  /** Shows a placeholder instead of the value, and marks it `aria-busy`. @default false */
  loading?: boolean;
  /** @default 'md' */
  size?: StatSize;
  className?: string;
};

const valueSize: Record<StatSize, string> = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-4xl',
};
const labelSize: Record<StatSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
};
const skeletonSize: Record<StatSize, string> = {
  sm: 'h-7 w-20',
  md: 'h-9 w-28',
  lg: 'h-10 w-32',
};

type Trend = 'up' | 'down' | 'flat';

/**
 * The change from `previous` to `value` as a fraction (0.12 = +12%). `undefined` when
 * there's no previous value, or it was 0: from 0, any rise is "infinitely" bigger, and
 * "+∞%" helps nobody.
 */
export function changeOf(value: number, previous?: number): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return (value - previous) / Math.abs(previous);
}

/**
 * One number on a dashboard: a label, the value, how it changed since `previous`
 * (an arrow and "+12.0%", green or red depending on `goodWhen`), and an optional
 * sparkline. Screen readers hear "Revenue this month, $84,210, up 12.0% vs September".
 *
 * Markup is a description list: the label is the `<dt>`, the value the `<dd>`. Inside
 * a StatGroup it's one entry of the group's `<dl>`; on its own it makes its own.
 */
export function Stat({
  label,
  value,
  format,
  locale,
  previous,
  period,
  goodWhen = 'up',
  sparkline,
  sparklineLabel,
  hint,
  loading = false,
  size = 'md',
  className,
}: StatProps) {
  const inGroup = useContext(InGroupContext);
  const change = changeOf(value, previous);
  // Rounded to the shown precision first, so "+0.0%" never shows as "up".
  const shown =
    change === undefined ? undefined : Math.round(change * 1000) / 1000;
  const trend: Trend | undefined =
    shown === undefined
      ? undefined
      : shown > 0
        ? 'up'
        : shown < 0
          ? 'down'
          : 'flat';
  const good =
    trend === undefined || trend === 'flat' ? undefined : trend === goodWhen;

  const body = (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className={cn('text-fg-muted', labelSize[size])}>{label}</dt>
      <dd aria-busy={loading || undefined} className="flex flex-col gap-1">
        {loading ? (
          <>
            <Skeleton className={skeletonSize[size]} />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          <>
            <span
              className={cn(
                'font-semibold tracking-tight text-fg tabular-nums',
                valueSize[size],
              )}
            >
              {new Intl.NumberFormat(locale, format).format(value)}
            </span>
            {shown !== undefined && trend && (
              <Change
                change={shown}
                trend={trend}
                good={good}
                period={period}
                locale={locale}
                size={size}
              />
            )}
            {hint && (
              <span className={cn('text-fg-muted', labelSize[size])}>
                {hint}
              </span>
            )}
            {sparkline && sparkline.length > 1 && (
              <Sparkline
                values={sparkline}
                label={sparklineLabel}
                good={good}
                size={size}
              />
            )}
          </>
        )}
      </dd>
    </div>
  );
  return inGroup ? body : <dl>{body}</dl>;
}

const trendWord: Record<Trend, string> = {
  up: 'Up',
  down: 'Down',
  flat: 'No change',
};

/** "↑ +12.0% vs September": shown with an arrow; read as "Up 12.0% vs September". */
function Change({
  change,
  trend,
  good,
  period,
  locale,
  size,
}: {
  change: number;
  trend: Trend;
  good: boolean | undefined;
  period?: string;
  locale?: string;
  size: StatSize;
}) {
  const pct = (signDisplay: 'exceptZero' | 'never') =>
    new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      signDisplay,
    }).format(change);
  return (
    <span
      className={cn('flex flex-wrap items-center gap-x-1.5', labelSize[size])}
    >
      {/* What eyes see: arrow + signed %, coloured. */}
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex items-center gap-0.5 rounded px-1 font-medium tabular-nums',
          good === true && 'bg-success-soft text-on-success-soft',
          good === false && 'bg-danger-soft text-on-danger-soft',
          good === undefined && 'bg-surface text-fg-muted',
        )}
      >
        <ArrowIcon trend={trend} className="size-3" />
        {pct('exceptZero')}
      </span>
      {/* What screen readers hear: words, not "+", "↑" or colour. */}
      <span className="sr-only">
        {trend === 'flat'
          ? trendWord.flat
          : `${trendWord[trend]} ${pct('never')}`}
      </span>
      {/* A real space, so it's read "12.0% vs September", not "12.0%vs". In a flex
          row a whitespace-only text node takes no room on screen. */}
      {period && ' '}
      {period && <span className="text-fg-muted">{period}</span>}
    </span>
  );
}

/**
 * A tiny line chart. viewBox 0 0 100 24, stretched to the box with
 * `preserveAspectRatio="none"`; `vectorEffect="non-scaling-stroke"` keeps the line
 * 1.5px thick however much it's stretched.
 */
function Sparkline({
  values,
  label,
  good,
  size,
}: {
  values: readonly number[];
  label?: string;
  good: boolean | undefined;
  size: StatSize;
}) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1; // all equal: a flat line in the middle
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = hi === lo ? 12 : 22 - ((v - lo) / span) * 20; // 2px margin top/bottom
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'mt-1 w-full',
        size === 'sm' ? 'h-6' : 'h-8',
        good === true && 'text-success',
        good === false && 'text-danger',
        good === undefined && 'text-fg-muted',
      )}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ArrowIcon({
  trend,
  ...props
}: SVGProps<SVGSVGElement> & { trend: Trend }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {trend === 'up' && <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" />}
      {trend === 'down' && <path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" />}
      {trend === 'flat' && <path d="M2 6h8" />}
    </svg>
  );
}
