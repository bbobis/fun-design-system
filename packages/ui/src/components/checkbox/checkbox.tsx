import {
  useCallback,
  useEffect,
  useRef,
  type ComponentProps,
  type Ref,
} from 'react';
import { cn } from '../../utils/cn';

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & {
  /**
   * Shows a dash instead of a tick: "some, but not all" (e.g. a select-all box when
   * some rows are selected). Screen readers announce it as "mixed".
   * @default false
   */
  indeterminate?: boolean;
  /** Classes for the wrapper `<span>` (use it for margins and layout). */
  className?: string;
};

/**
 * A native `<input type="checkbox">` with the design-system look. Because it is the
 * real input, Space toggles it, forms submit it and screen readers know it, with no
 * extra code. Give it a name: wrap it in a `<label>` or pass `aria-label`.
 *
 * All input props (`checked`, `onChange`, `aria-label`, `ref`…) go to the input;
 * `className` goes to the wrapper.
 */
export function Checkbox({
  indeterminate = false,
  className,
  ref,
  ...rest
}: CheckboxProps) {
  const inner = useRef<HTMLInputElement | null>(null);

  // `indeterminate` is a DOM *property*, not an HTML attribute, so React can't set it
  // from JSX. We set it on the element after render.
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  // We need the element ourselves *and* must pass it to the caller's ref.
  const setRefs = useCallback(
    (el: HTMLInputElement | null) => {
      inner.current = el;
      assignRef(ref, el);
    },
    [ref],
  );

  return (
    <span
      className={cn(
        'relative inline-grid size-4 shrink-0 place-items-center',
        // Fade box *and* tick together. Fading only the input left a dark tick on a
        // dark, half-transparent box in dark mode (invisible).
        'has-[:disabled]:opacity-50',
        className,
      )}
    >
      <input
        ref={setRefs}
        type="checkbox"
        className={cn(
          // `peer` lets the sibling icon react to this input's state (peer-checked:).
          'peer col-start-1 row-start-1 size-4 cursor-pointer appearance-none rounded-[4px]',
          'border-[1.5px] border-border-strong bg-bg transition-colors',
          'hover:border-fg',
          'checked:border-primary checked:bg-primary checked:hover:border-primary-hover checked:hover:bg-primary-hover',
          'indeterminate:border-primary indeterminate:bg-primary indeterminate:hover:bg-primary-hover',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          'disabled:cursor-not-allowed',
        )}
        {...rest}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          'pointer-events-none col-start-1 row-start-1 size-3 text-on-primary',
          indeterminate ? 'opacity-100' : 'opacity-0 peer-checked:opacity-100',
        )}
      >
        {indeterminate ? (
          <path d="M3 6h6" />
        ) : (
          <path d="m2.5 6.5 2.25 2L9.5 3.5" />
        )}
      </svg>
    </span>
  );
}

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}
