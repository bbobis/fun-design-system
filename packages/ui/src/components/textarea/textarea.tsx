import { useId, useState, type ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import { cssVars } from '../../utils/css-vars';
import { useFieldContext } from '../field/field-context';

export type TextAreaProps = ComponentProps<'textarea'> & {
  /** Marks it invalid (`aria-invalid`). Inside a Field, set for you. @default false */
  invalid?: boolean;
  /**
   * With `maxLength`, show "12 / 500" under the box. It's linked with
   * `aria-describedby`, so it's read when the field gets focus, not on every key.
   * @default false
   */
  showCount?: boolean;
};

/**
 * A native multi-line text box, styled like Input. It grows with its content (up to
 * 12 lines, then scrolls), so people can see what they wrote. Use it inside `Field`.
 */
export function TextArea({
  invalid,
  showCount = false,
  id,
  required,
  disabled,
  rows = 3,
  maxLength,
  value,
  defaultValue,
  onChange,
  className,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextAreaProps) {
  const field = useFieldContext();
  const countId = useId();
  // Count even when uncontrolled: track length from changes.
  const initial = String(value ?? defaultValue ?? '').length;
  const [length, setLength] = useState(initial);
  const shownLength = value !== undefined ? String(value).length : length;
  const counting = showCount && maxLength !== undefined;

  const describedBy =
    [field?.describedBy, ariaDescribedBy, counting ? countId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="flex w-full flex-col gap-1">
      <textarea
        id={id ?? field?.controlId}
        required={required ?? field?.required}
        disabled={disabled ?? field?.disabled}
        aria-invalid={(invalid ?? field?.invalid) || undefined}
        aria-describedby={describedBy}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setLength(e.target.value.length);
          onChange?.(e);
        }}
        style={cssVars({ '--rows': rows })}
        className={cn(
          'w-full min-w-0 resize-y rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-fg',
          // Grows with the text (field-sizing: Chromium today; elsewhere it keeps `rows`).
          // field-sizing ignores `rows`, so the minimum height comes from --rows.
          '[field-sizing:content] max-h-[calc(12lh+1rem)] min-h-[calc(var(--rows)*1lh+1rem)]',
          'placeholder:text-fg-muted transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          'aria-invalid:border-danger',
          'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
          className,
        )}
        {...rest}
      />
      {counting && (
        <p
          id={countId}
          className={cn(
            'self-end text-xs tabular-nums',
            shownLength >= maxLength ? 'text-fg-danger' : 'text-fg-muted',
          )}
        >
          {shownLength} / {maxLength}
          <span className="sr-only"> characters</span>
        </p>
      )}
    </div>
  );
}
