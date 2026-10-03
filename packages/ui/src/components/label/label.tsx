import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

export type LabelProps = ComponentProps<'label'> & {
  /**
   * Adds a visual "*" after the text. The marker is hidden from screen readers;
   * put `required` on the input itself so assistive tech announces it.
   * @default false
   */
  required?: boolean;
};

/**
 * A native `<label>`. Connect it to a control with `htmlFor` + the control's `id`,
 * or wrap both in `Field`, which does the wiring for you.
 */
export function Label({
  required = false,
  className,
  children,
  ...rest
}: LabelProps) {
  return (
    <label className={cn('text-sm font-medium text-fg', className)} {...rest}>
      {children}
      {required && (
        <span aria-hidden="true" className="ms-0.5 text-fg-danger">
          *
        </span>
      )}
    </label>
  );
}
