import { createContext, useContext } from 'react';

/**
 * Sizes shared by Checkbox, CheckboxGroup, RadioGroup and Switch, so a form that
 * mixes them stays in proportion. Change a size here, once (same idea as
 * `field/field-surface.ts`).
 */
export type ChoiceSize = 'sm' | 'md' | 'lg';
/** `end`: control, then label (default). `start`: label first, control at the far end. */
export type LabelPosition = 'start' | 'end';

export const choiceSize = {
  /** The checkbox square / radio circle. */
  box: { sm: 'size-3.5', md: 'size-4', lg: 'size-5' },
  /** The tick inside the checkbox. */
  tick: { sm: 'size-2.5', md: 'size-3', lg: 'size-3.5' },
  /** The dot inside the radio. */
  dot: { sm: 'size-1', md: 'size-1.5', lg: 'size-2' },
  /** Label text. The control is nudged down to sit on the first line of it. */
  text: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
  align: { sm: 'mt-px', md: 'mt-0.5', lg: 'mt-0.5' },
  /** Switch track and thumb (and how far the thumb travels). */
  track: { sm: 'h-4 w-7', md: 'h-5 w-9', lg: 'h-6 w-11' },
  thumb: {
    sm: 'size-2.5 group-data-selected:translate-x-3 rtl:group-data-selected:-translate-x-3',
    md: 'size-3.5 group-data-selected:translate-x-4 rtl:group-data-selected:-translate-x-4',
    lg: 'size-4.5 group-data-selected:translate-x-5 rtl:group-data-selected:-translate-x-5',
  },
} as const;

/**
 * Layout of one choice (control + label). `start` only changes the *visual* order
 * (`flex-row-reverse`): the control and its label are one element, so the name read
 * out and the Tab order are the same either way.
 */
export const choiceLayout = (position: LabelPosition) =>
  position === 'start'
    ? 'flex w-full flex-row-reverse items-start justify-between gap-3'
    : 'flex items-start gap-2';

/** Set once on RadioGroup / CheckboxGroup; their items read it. */
export const ChoiceStyleContext = createContext<{
  size: ChoiceSize;
  labelPosition: LabelPosition;
}>({ size: 'md', labelPosition: 'end' });
export const useChoiceStyle = () => useContext(ChoiceStyleContext);
