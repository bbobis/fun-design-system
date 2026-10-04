import { createContext, useContext } from 'react';

/** What a Field shares with the control inside it. */
export type FieldContextValue = {
  /** id for the control; the label's `htmlFor` points at it. */
  controlId: string;
  /**
   * id of the visible label. Controls that `htmlFor` can't name (a listbox trigger, a
   * custom widget) use it as `aria-labelledby`.
   */
  labelId: string;
  /** Space-separated ids of the description and error, for `aria-describedby`. */
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
};

export const FieldContext = createContext<FieldContextValue | null>(null);

/** Returns the surrounding Field's wiring, or `null` when the control is used on its own. */
export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}
