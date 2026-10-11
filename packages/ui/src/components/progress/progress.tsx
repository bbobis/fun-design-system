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
  className,
}: ProgressBarProps) {
  return (
    <AriaProgressBar
      value={value}
      minValue={min}
      maxValue={max}
      isIndeterminate={value === undefined}
      valueLabel={valueLabel}
      className={cn('flex w-full flex-col gap-1.5', className)}
    >
      {({ percentage, valueText, isIndeterminate }) => (
        <>
          <div className="flex justify-between gap-4 text-sm">
            <Label className="font-medium text-fg">{label}</Label>
            {!hideValue && !isIndeterminate && (
              <span className="text-fg-muted tabular-nums">{valueText}</span>
            )}
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-surface">
            {isIndeterminate ? (
              <div className="absolute inset-y-0 w-1/3 animate-[progress-slide_1.4s_ease-in-out_infinite] rounded-full bg-primary motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-50" />
            ) : (
              // The one runtime number: how full. A CSS variable through cssVars (rule 13),
              // read by a scale-x class, so no inline width.
              <div
                className="h-full origin-left scale-x-(--progress) rounded-full bg-primary transition-transform rtl:origin-right"
                style={cssVars({ '--progress': (percentage ?? 0) / 100 })}
              />
            )}
          </div>
        </>
      )}
    </AriaProgressBar>
  );
}
