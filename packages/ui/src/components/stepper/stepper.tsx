import { cn } from '../../utils/cn';
import { CheckIcon } from '../combobox/combobox-parts';

export type StepperStep = {
  /** Stable and unique. What `current` and `onStepClick` use. */
  id: string;
  /** Short name of the step ("Billing"). */
  label: string;
  /** A second line under the label (vertical layout only). */
  description?: string;
};

export type StepperProps = {
  /** The steps, in order. */
  steps: readonly StepperStep[];
  /** The step the user is on. Steps before it are done; steps after it are to come. */
  current: string;
  /** Names the list for screen readers. @default 'Progress' */
  'aria-label'?: string;
  /**
   * Makes *completed* steps buttons, to go back to them. Steps to come are never
   * clickable (you can't skip ahead). Leave out for a display-only stepper.
   */
  onStepClick?: (id: string) => void;
  /**
   * `horizontal` for the top of a form (on phones only the current step's label
   * shows); `vertical` for a side column, with descriptions. @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

type Status = 'complete' | 'current' | 'upcoming';

/**
 * Where you are in a multi-step task: "Details → Billing → Review".
 *
 * An ordered list, so screen readers say "list, 4 items" and "2 of 4". The current
 * step has `aria-current="step"` ("current step"), and every status is spelled out
 * for screen readers (a ✓ plus "completed"), never shown by color alone.
 *
 * Plain markup: React Aria has no stepper because there's no widget here, just a
 * list that marks a position. It's only interactive with `onStepClick`.
 *
 * @example
 * <Stepper steps={steps} current="billing" onStepClick={goTo} />
 */
export function Stepper({
  steps,
  current,
  'aria-label': ariaLabel = 'Progress',
  onStepClick,
  orientation = 'horizontal',
  className,
}: StepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === current);
  const vertical = orientation === 'vertical';

  return (
    <ol
      aria-label={ariaLabel}
      className={cn(
        'flex',
        vertical ? 'flex-col' : 'flex-row items-start',
        className,
      )}
    >
      {steps.map((step, index) => {
        const status: Status =
          index < currentIndex
            ? 'complete'
            : index === currentIndex
              ? 'current'
              : 'upcoming';
        const last = index === steps.length - 1;
        const clickable = Boolean(onStepClick) && status === 'complete';

        const content = (
          <>
            <Marker status={status} number={index + 1} />
            <span
              className={cn(
                'flex min-w-0 flex-col',
                // Phones: only the current step's label shows in a row; the others stay
                // in the accessibility tree (sr-only), so nothing is lost for screen readers.
                !vertical && status !== 'current' && 'max-sm:sr-only',
              )}
            >
              <span
                className={cn(
                  'text-sm',
                  status === 'current'
                    ? 'font-semibold text-fg'
                    : status === 'complete'
                      ? 'text-fg'
                      : 'text-fg-muted',
                )}
              >
                {step.label}
                {/* The status in words, for screen readers. "current step" comes from
                    aria-current, so it isn't repeated here. */}
                {status !== 'current' && (
                  <span className="sr-only">
                    {status === 'complete' ? ', completed' : ', not started'}
                  </span>
                )}
              </span>
              {vertical && step.description && (
                <span className="text-sm text-fg-muted">
                  {step.description}
                </span>
              )}
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            aria-current={status === 'current' ? 'step' : undefined}
            className={cn(
              'flex',
              // flex-auto, not flex-1: each step starts at its content width and they share
              // only the *extra* space, so every connector line gets the same length.
              vertical ? 'flex-col' : 'min-w-0 flex-auto flex-row items-center',
              !vertical && last && 'flex-none',
            )}
          >
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  stepRow(vertical),
                  'cursor-pointer rounded-md text-start outline-hidden hover:bg-surface',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus-ring',
                )}
              >
                {content}
              </button>
            ) : (
              <span className={stepRow(vertical)}>{content}</span>
            )}
            {!last && (
              <Connector vertical={vertical} done={status === 'complete'} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

const stepRow = (vertical: boolean) =>
  cn('flex shrink-0 gap-2 p-1', vertical ? 'items-start' : 'items-center');

/** The circle: ✓ when done, the step number otherwise. */
function Marker({ status, number }: { status: Status; number: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums',
        status === 'complete' && 'border-primary bg-primary text-on-primary',
        status === 'current' && 'border-primary bg-bg text-fg',
        status === 'upcoming' && 'border-border-strong bg-bg text-fg-muted',
      )}
    >
      {status === 'complete' ? <CheckIcon className="size-4" /> : number}
    </span>
  );
}

/** The line to the next step: solid when this step is done. Decorative. */
function Connector({ vertical, done }: { vertical: boolean; done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'rounded-full',
        done ? 'bg-primary' : 'bg-border-strong',
        vertical
          ? 'ms-[17px] my-1 min-h-4 w-0.5'
          : 'mx-1 h-0.5 min-w-3 flex-1 sm:mx-2 sm:min-w-4',
      )}
    />
  );
}
