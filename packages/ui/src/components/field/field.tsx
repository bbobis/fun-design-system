import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Label } from '../label';
import { FieldContext, type FieldContextValue } from './field-context';

export type FieldProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Visible label text. Always required: placeholder text is not a label. */
  label: ReactNode;
  /** Help text under the control. Linked with `aria-describedby`. */
  description?: ReactNode;
  /**
   * Error message. When set, the control is marked `aria-invalid` and the message is
   * linked with `aria-describedby`, so a screen reader reads it on focus.
   */
  error?: ReactNode;
  /** Marks the control `required` and shows "*" after the label. @default false */
  required?: boolean;
  /** Disables the control inside. @default false */
  disabled?: boolean;
  /** The control, usually a single `<Input />`. */
  children: ReactNode;
};

/**
 * A composite: Label + control + description + error, wired together.
 *
 * @example
 * <Field label="Email" description="We never share it." error={errors.email}>
 *   <Input type="email" />
 * </Field>
 */
export function Field({
  label,
  description,
  error,
  required = false,
  disabled = false,
  className,
  children,
  ...rest
}: FieldProps) {
  const baseId = useId();
  const controlId = `${baseId}-control`;
  const labelId = `${baseId}-label`;
  const descriptionId = description ? `${baseId}-description` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const context: FieldContextValue = {
    controlId,
    labelId,
    describedBy,
    invalid: Boolean(error),
    required,
    disabled,
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...rest}>
      <Label id={labelId} htmlFor={controlId} required={required}>
        {label}
      </Label>
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {description && (
        <p id={descriptionId} className="text-sm text-fg-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-fg-danger">
          {error}
        </p>
      )}
    </div>
  );
}
