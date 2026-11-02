import { cva, type VariantProps } from 'class-variance-authority';
import { Label, ProgressBar as AriaProgressBar } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { cssVars } from '../../utils/css-vars';

const spinnerVariants = cva(
  'inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]',
  {
    variants: {
      size: { sm: 'size-4', md: 'size-6', lg: 'size-8' },
    },
    defaultVariants: { size: 'md' },
  },
);

export type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  /** What is loading, for screen readers ("Loading invoices"). @default 'Loading' */
  label?: string;
  className?: string;
};

/**
 * "Working on it", for a wait with no known end. Screen readers hear the `label`
 * (it's a `progressbar` without a value). Inside a Button, use Button's `loading`
 * prop instead: it also keeps the button from being pressed twice.
 */
export function Spinner({ label = 'Loading', size, className }: SpinnerProps) {
  return (
    <AriaProgressBar
      isIndeterminate
      aria-label={label}
      className={cn('inline-flex text-fg-muted', className)}
    >
      <span aria-hidden="true" className={spinnerVariants({ size })} />
    </AriaProgressBar>
  );
}

/** The fill's color. `primary` for normal work; a tone when the outcome matters. */
export type ProgressTone =
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

const toneFill: Record<ProgressTone, { bar: string; ring: string }> = {
  primary: { bar: 'bg-primary', ring: 'stroke-primary' },
  info: { bar: 'bg-info', ring: 'stroke-info' },
  success: { bar: 'bg-success', ring: 'stroke-success' },
  warning: { bar: 'bg-warning', ring: 'stroke-warning' },
  danger: { bar: 'bg-danger', ring: 'stroke-danger' },
};

const trackHeight = { sm: 'h-1', md: 'h-2', lg: 'h-3' } as const;

export type ProgressBarProps = {
  /** Shown above the bar, and its accessible name ("Uploading invoices.csv"). */
  label: string;
  /** How far along, between `min` and `max`. Leave it out when you don't know (an indeterminate stripe). */
  value?: number;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /**
   * Text after the label. By default the percentage ("45%"); pass your own for
   * counts ("120 of 300 rows"). Screen readers read it too.
   */
  valueLabel?: string;
  /** Hide the value text (the percentage is still read out). @default false */
  hideValue?: boolean;
  /**
   * Hide the label row; the label still names the bar for screen readers. For when
   * the text around the bar already says what it is (a file row in FileUpload).
   * @default false
   */
  hideLabel?: boolean;
  /**
   * The fill's color: `success` when it finished, `danger` when it failed, `warning`
   * when it's nearly full (storage). Say the outcome in text too (`valueLabel`, or a
   * message nearby): color alone doesn't reach everyone. @default 'primary'
   */
  tone?: ProgressTone;
  /** Bar thickness: `sm` 4px, `md` 8px, `lg` 12px. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Where the value text goes: `top` (on the label row) or `end` (beside the bar,
   * for compact rows). @default 'top'
   */
  valuePosition?: 'top' | 'end';
  className?: string;
};

/**
 * How much of a task is done: an upload, an import, a batch save. Built on React Aria
 * `ProgressBar` (`role="progressbar"` with `aria-valuenow`, `-min`, `-max` and
 * `aria-valuetext`).
 */
export function ProgressBar({
  label,
  value,
  min = 0,
  max = 100,
  valueLabel,
  hideValue = false,
  hideLabel = false,
  tone = 'primary',
  size = 'md',
  valuePosition = 'top',
  className,
}: ProgressBarProps) {
  const fill = toneFill[tone].bar;
  return (
    <AriaProgressBar
      value={value}
      minValue={min}
      maxValue={max}
      isIndeterminate={value === undefined}
      valueLabel={valueLabel}
      className={cn('flex w-full flex-col gap-1.5', className)}
    >
      {({ percentage, valueText, isIndeterminate }) => {
        const showValue = !hideValue && !isIndeterminate;
        const value = showValue && (
          <span
            className={cn(
              'text-fg-muted tabular-nums',
              // Beside the bar: at least as wide as "100%", so bars in a list line up.
              valuePosition === 'end' && 'min-w-10 text-end',
            )}
          >
            {valueText}
          </span>
        );
        const bar = (
          <div
            className={cn(
              'relative overflow-hidden rounded-full bg-surface',
              trackHeight[size],
              valuePosition === 'end' && 'flex-1',
            )}
          >
            {isIndeterminate ? (
              <div
                className={cn(
                  'absolute inset-y-0 w-1/3 animate-[progress-slide_1.4s_ease-in-out_infinite] rounded-full motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-50',
                  fill,
                )}
              />
            ) : (
              // The one runtime number: how full. A CSS variable through cssVars (rule 13),
              // read by a scale-x class, so no inline width.
              <div
                data-progress-fill=""
                className={cn(
                  'h-full origin-left scale-x-(--progress) rounded-full transition-transform rtl:origin-right',
                  fill,
                )}
                style={cssVars({ '--progress': (percentage ?? 0) / 100 })}
              />
            )}
          </div>
        );
        return (
          <>
            {hideLabel ? (
              <Label className="sr-only">{label}</Label>
            ) : (
              <div className="flex justify-between gap-4 text-sm">
                <Label className="font-medium text-fg">{label}</Label>
                {valuePosition === 'top' && value}
              </div>
            )}
            {valuePosition === 'end' ? (
              <div className="flex items-center gap-3 text-sm">
                {bar}
                {value}
              </div>
            ) : (
              // With hideLabel there's no label row, so no visible value either
              // (as before): screen readers still get it from aria-valuetext.
              bar
            )}
          </>
        );
      }}
    </AriaProgressBar>
  );
}

const ringSize = {
  sm: { svg: 'size-5', text: '' },
  md: { svg: 'size-10', text: 'text-[0.5625rem]' },
  lg: { svg: 'size-14', text: 'text-xs' },
} as const;

export type ProgressCircleProps = {
  /** What is in progress ("Syncing invoices"). Its accessible name; not shown. */
  label: string;
  /** How far along, between `min` and `max`. Leave it out for a spinning arc. */
  value?: number;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** What screen readers hear instead of the percentage ("3 of 12 files"). */
  valueLabel?: string;
  /** `sm` 20px (beside text), `md` 40px, `lg` 56px. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** @default 'primary' */
  tone?: ProgressTone;
  /** Show the percentage in the middle (`md` and `lg` only: `sm` is too small). @default false */
  showValue?: boolean;
  className?: string;
};

/**
 * The ring version of ProgressBar, for tight spots: a card corner, a table cell, next
 * to a file name. Same role and attributes as the bar (`progressbar` with
 * `aria-valuenow` and `aria-valuetext`): the shape is only visual. The label isn't
 * shown, so say what's happening nearby in text too.
 *
 * @example
 * <ProgressCircle label="Uploading invoices.csv" value={45} showValue />
 */
export function ProgressCircle({
  label,
  value,
  min = 0,
  max = 100,
  valueLabel,
  size = 'md',
  tone = 'primary',
  showValue = false,
  className,
}: ProgressCircleProps) {
  return (
    <AriaProgressBar
      aria-label={label}
      value={value}
      minValue={min}
      maxValue={max}
      isIndeterminate={value === undefined}
      valueLabel={valueLabel}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        className,
      )}
    >
      {({ percentage, isIndeterminate }) => (
        <>
          {/* pathLength=100 makes the ring 100 units long, so "45% done" is a
              dash of 45: stroke-dashoffset = 100 - 45. The -90° turn starts it at
              the top; in right-to-left it fills the other way round. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 32 32"
            className={cn(
              ringSize[size].svg,
              '-rotate-90 rtl:-scale-x-100',
              isIndeterminate &&
                'animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]',
            )}
            style={cssVars({
              '--progress': isIndeterminate ? 0.25 : (percentage ?? 0) / 100,
            })}
          >
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              strokeWidth="3.5"
              className="stroke-surface"
            />
            <circle
              data-progress-fill=""
              cx="16"
              cy="16"
              r="13"
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="100"
              className={cn(
                '[stroke-dashoffset:calc((1-var(--progress))*100)] transition-[stroke-dashoffset]',
                toneFill[tone].ring,
              )}
            />
          </svg>
          {showValue && !isIndeterminate && size !== 'sm' && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute font-medium text-fg tabular-nums',
                ringSize[size].text,
              )}
            >
              {Math.round(percentage ?? 0)}%
            </span>
          )}
        </>
      )}
    </AriaProgressBar>
  );
}
