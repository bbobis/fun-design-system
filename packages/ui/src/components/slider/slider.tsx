import { cva, type VariantProps } from 'class-variance-authority';
import { useContext, useId, type ReactNode } from 'react';
import {
  Label,
  Slider as AriaSlider,
  SliderFill,
  SliderOutput,
  SliderStateContext,
  SliderThumb,
  SliderTrack,
  Text,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

/** One number, or a `[start, end]` pair for a range (two thumbs). */
export type SliderValue = number | [number, number];

const trackVariants = cva(
  'relative w-full rounded-full bg-border-strong group-data-disabled:opacity-60',
  {
    variants: {
      size: { sm: 'h-1', md: 'h-1.5' },
    },
    defaultVariants: { size: 'md' },
  },
);

const thumbVariants = cva(
  [
    // React Aria sets left and translate(-50%, -50%) on the thumb; top-1/2 puts
    // its center on the track's center line.
    'top-1/2 rounded-full border-2 border-primary bg-bg shadow-sm',
    'transition-[box-shadow] data-hovered:shadow-md data-dragging:shadow-md',
    'outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
    'data-disabled:border-border-strong',
  ],
  {
    variants: {
      size: { sm: 'size-4', md: 'size-5' },
    },
    defaultVariants: { size: 'md' },
  },
);

export type SliderProps<T extends SliderValue = number> = VariantProps<
  typeof trackVariants
> & {
  /** What the slider sets ("Volume", "Price"). Shown above it; names it. Required. */
  label: ReactNode;
  /** Help text under the slider. */
  description?: ReactNode;
  /**
   * The value (controlled). A number gives one thumb; a `[start, end]` pair gives a
   * range with two thumbs. `onChange` hands back the same shape.
   */
  value?: T;
  /** Starting value when uncontrolled. Its shape (number or pair) picks one or two thumbs. */
  defaultValue?: T;
  /** Called on every move (each drag step, each key press). Use it to update the screen. */
  onChange?: (value: T) => void;
  /**
   * Called once when the user lets go (pointer up, or after a key press). Use it for
   * slow work: fetching results, saving a setting.
   */
  onChangeEnd?: (value: T) => void;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** The smallest change; values snap to it. @default 1 */
  step?: number;
  /**
   * How the value is shown and read out, in the user's locale (standard
   * `Intl.NumberFormat` options). The app always gets plain numbers back.
   */
  formatOptions?: Intl.NumberFormatOptions;
  /**
   * Words for a value, when a number isn't what the steps mean: `(i) => times[i]`
   * turns 0, 1, 2 into "06:00", "07:00", "08:00". Shown next to the label and read
   * out on the thumb (`aria-valuetext`). Wins over `formatOptions`.
   */
  getValueLabel?: (value: number) => string;
  /**
   * Range only: names for the two thumbs, read out with the label
   * ("Minimum Price"). @default ['Minimum', 'Maximum']
   */
  thumbLabels?: [string, string];
  /** Hide the value next to the label (it is still read out on each thumb). @default false */
  hideValue?: boolean;
  /** Form field name. Each thumb posts its number under this name. */
  name?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Swaps how values are put into words, for everything inside (the output and the
 * thumbs). React Aria's slider only formats numbers (`Intl.NumberFormat`), and its
 * thumbs read their `aria-valuetext` from the slider's state, which we can reach
 * through React Aria's own `SliderStateContext`.
 *
 * We replace the one method on that same object instead of providing a copy: React
 * Aria keeps internal data in a WeakMap keyed by this exact state object, so a copy is
 * rejected ("Unknown slider state"). The state is rebuilt on every render, so the
 * change never outlives the render that made it.
 */
function ValueLabels({
  getValueLabel,
  children,
}: {
  getValueLabel?: (value: number) => string;
  children: ReactNode;
}) {
  const state = useContext(SliderStateContext);
  if (getValueLabel && state) {
    state.getThumbValueLabel = (i: number) =>
      getValueLabel(state.values[i] ?? 0);
  }
  return <>{children}</>;
}

/**
 * Pick a number, or a range of numbers, by dragging along a track. Good when the exact
 * number matters less than "about here" (volume, a price filter). When people need
 * an exact number, use NumberField (or both together).
 *
 * Keyboard: Tab to a thumb, ←/→ or ↑/↓ change it by `step`, PageUp/PageDown by a
 * tenth of the range, Home/End jump to the ends. Built on React Aria `Slider`: each
 * thumb is a native `<input type="range">`, named by the label (plus its thumb label in
 * a range), and the value is read out formatted ("$40").
 *
 * In a range the thumbs can't cross: the start can't go past the end.
 */
export function Slider<T extends SliderValue = number>({
  label,
  description,
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  formatOptions,
  getValueLabel,
  thumbLabels = ['Minimum', 'Maximum'],
  hideValue = false,
  name,
  disabled = false,
  size,
  className,
}: SliderProps<T>) {
  const descriptionId = useId();
  const isRange = Array.isArray(value ?? defaultValue);
  // React Aria hands back number | number[]; give the app back the shape it gave us.
  const toOurs = (v: number | number[]) =>
    (Array.isArray(v) ? [v[0], v[1]] : v) as T;

  return (
    <AriaSlider
      value={value}
      // Only when uncontrolled. React Aria picks "one number or a range" from
      // `typeof value === 'number' || typeof defaultValue === 'number'`, so a
      // fallback number here would turn a controlled range into a single slider.
      defaultValue={
        value === undefined ? (defaultValue ?? (min as T)) : undefined
      }
      onChange={onChange && ((v) => onChange(toOurs(v)))}
      onChangeEnd={onChangeEnd && ((v) => onChangeEnd(toOurs(v)))}
      minValue={min}
      maxValue={max}
      step={step}
      formatOptions={formatOptions}
      isDisabled={disabled}
      className={cn('group flex w-full flex-col gap-2', className)}
    >
      <ValueLabels getValueLabel={getValueLabel}>
        <div className="flex items-baseline justify-between gap-3">
          <Label className="text-sm font-medium text-fg group-data-disabled:text-fg-muted">
            {label}
          </Label>
          {!hideValue && (
            // "40" or "20 – 80", formatted by React Aria.
            <SliderOutput className="text-sm text-fg-muted tabular-nums">
              {getValueLabel &&
                (({ state }) => state.values.map(getValueLabel).join(' – '))}
            </SliderOutput>
          )}
        </div>
        {/* py: the thumbs are taller than the track; this keeps them inside the box. */}
        <SliderTrack
          className={cn('flex items-center', size === 'sm' ? 'py-1.5' : 'py-2')}
        >
          <div className={trackVariants({ size })}>
            <SliderFill className="rounded-full bg-primary group-data-disabled:bg-fg-muted" />
            {(isRange ? [0, 1] : [0]).map((index) => (
              <SliderThumb
                key={index}
                index={index}
                name={name}
                aria-label={isRange ? thumbLabels[index] : undefined}
                aria-describedby={description ? descriptionId : undefined}
                className={thumbVariants({ size })}
              />
            ))}
          </div>
        </SliderTrack>
        {description && (
          <Text
            id={descriptionId}
            slot="description"
            className="text-sm text-fg-muted"
          >
            {description}
          </Text>
        )}
      </ValueLabels>
    </AriaSlider>
  );
}
