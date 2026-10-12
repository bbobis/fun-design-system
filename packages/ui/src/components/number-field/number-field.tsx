import { cva, type VariantProps } from 'class-variance-authority';
import type { SVGProps } from 'react';
import {
  Button,
  Group,
  Input,
  NumberField as AriaNumberField,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { useFieldContext } from '../field/field-context';

// Same box and heights as Input; the − / + buttons sit inside the border.
const fieldVariants = cva(
  [
    'flex w-full min-w-0 items-center rounded-md border border-border-strong bg-bg text-fg',
    'transition-colors',
    'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring',
    'group-data-invalid:border-danger',
    'group-data-disabled:cursor-not-allowed group-data-disabled:bg-surface group-data-disabled:opacity-60',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

const inputPad = { sm: 'px-2.5', md: 'px-3', lg: 'px-4' } as const;

export type NumberFieldProps = VariantProps<typeof fieldVariants> & {
  /** The number (controlled). `null` = empty. */
  value?: number | null;
  /** Starting number when uncontrolled. */
  defaultValue?: number | null;
  /**
   * Called with the new number, or `null` when cleared. Fires when the user commits
   * (blur, Enter, ↑/↓, the buttons), not on every keystroke.
   */
  onChange?: (value: number | null) => void;
  /** Lowest allowed number. Typed values are clamped to it on commit. */
  min?: number;
  /** Highest allowed number. */
  max?: number;
  /** How much ↑/↓ and the buttons change it; typed values snap to it. @default 1 */
  step?: number;
  /**
   * How the number is shown, in the user's locale (standard `Intl.NumberFormat`
   * options). The app always gets a plain number back.
   * @example { style: 'currency', currency: 'CAD' }  // $1,234.50
   * @example { style: 'percent' }                    // 0.15 shows as 15%
   * @example { maximumFractionDigits: 0 }           // whole numbers only
   */
  formatOptions?: Intl.NumberFormatOptions;
  /** Hide the − / + buttons (e.g. in a dense form). ↑/↓ still work. @default false */
  hideStepper?: boolean;
  onBlur?: () => void;
  /** Form field name. Posts the plain number ("1234.5"), not the formatted text. */
  name?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** id of the input. Inside a Field, the Field's control id. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
};

/**
 * A number input that formats as you'd expect ($1,234.50, 15%) in the user's locale,
 * parses what they type back into a number, and steps with ↑/↓ or the − / + buttons.
 * Built on React Aria `NumberField` (`role="textbox"` with `inputmode="decimal"`, and
 * the value spoken in its formatted form).
 *
 * Use it for quantities and amounts. For codes that only look like numbers (a postal
 * code, a PO number, an account number), use Input: they must never be reformatted.
 */
export function NumberField({
  value,
  defaultValue,
  onChange,
  min,
  max,
  step,
  formatOptions,
  hideStepper = false,
  onBlur,
  name,
  size,
  invalid,
  required,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
}: NumberFieldProps) {
  const field = useFieldContext();
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;
  const s = size ?? 'md';

  return (
    <AriaNumberField
      // React Aria uses NaN for "empty"; our API says null (rule 17: plain values).
      value={value === undefined ? undefined : (value ?? NaN)}
      defaultValue={defaultValue ?? undefined}
      onChange={(n) => onChange?.(Number.isNaN(n) ? null : n)}
      minValue={min}
      maxValue={max}
      step={step}
      formatOptions={formatOptions}
      // Scrolling the page over a focused field must not change an amount.
      isWheelDisabled
      onBlur={onBlur}
      name={name}
      // false on purpose: React Aria clamps to min/max on blur instead of flagging,
      // so there's no own check to hide (component-recipe.md, rule 24).
      isInvalid={invalid ?? field?.invalid ?? false}
      isRequired={required ?? field?.required ?? false}
      isDisabled={disabled ?? field?.disabled ?? false}
      validationBehavior="aria"
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)
      }
      aria-describedby={describedBy}
      className={cn('group flex w-full flex-col', className)}
    >
      <Group className={fieldVariants({ size })}>
        <Input
          id={id ?? field?.controlId}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent text-end tabular-nums outline-hidden placeholder:text-fg-muted',
            inputPad[s],
          )}
        />
        {!hideStepper && (
          <div className="flex h-full shrink-0 border-s border-border-strong">
            <Button slot="decrement" className={stepButton}>
              <MinusIcon className="size-3.5" />
            </Button>
            <Button
              slot="increment"
              className={cn(stepButton, 'rounded-e-md border-s border-border')}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
        )}
      </Group>
    </AriaNumberField>
  );
}

// Not in the Tab order (React Aria's choice): keyboard users have ↑/↓.
const stepButton =
  'flex h-full w-8 items-center justify-center text-fg-muted outline-hidden hover:bg-surface hover:text-fg data-disabled:opacity-40 data-disabled:hover:bg-transparent';

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      {...props}
    />
  );
}
const MinusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3.5 8h9" />
  </Svg>
);
const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3.5 8h9M8 3.5v9" />
  </Svg>
);
