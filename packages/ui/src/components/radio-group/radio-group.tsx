import { useId, type ReactNode } from 'react';
import {
  FieldError,
  Label,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  Text,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import {
  SelectableCardText,
  selectableCardClasses,
  useSelectableCardIds,
  type SelectableCardBaseProps,
} from '../card/selectable-card';

export type RadioGroupProps = {
  /** The question, shown above the choices. It names the group. Required. */
  label: ReactNode;
  /** Help text under the label. */
  description?: ReactNode;
  /** Error message. Marks the group invalid; read out with the group. */
  error?: ReactNode;
  /** The chosen value (controlled). `null` = nothing chosen. */
  value?: string | null;
  /** Starting value when uncontrolled. */
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  /** Form field name. Posts the chosen value. */
  name?: string;
  /** @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  required?: boolean;
  disabled?: boolean;
  /** `Radio` or `RadioCard` elements. */
  children: ReactNode;
  className?: string;
};

/**
 * Pick exactly one of a few visible choices (2 to about 6). For more, or when space is
 * tight, use Select.
 *
 * Keyboard: Tab enters the group on the chosen radio (or the first), ↑↓ / ←→ move
 * *and* choose, Tab leaves. One Tab stop for the whole group. Built on React Aria
 * `RadioGroup` (`role="radiogroup"` named by the label, with native radio inputs).
 *
 * It has its own label and error props instead of going inside `Field`: a group is
 * named by its label (a legend), not by a `<label for>` pointing at one control.
 */
export function RadioGroup({
  label,
  description,
  error,
  value,
  defaultValue,
  onChange,
  name,
  orientation = 'vertical',
  required = false,
  disabled = false,
  children,
  className,
}: RadioGroupProps) {
  return (
    <AriaRadioGroup
      value={value === undefined ? undefined : value}
      defaultValue={defaultValue ?? undefined}
      onChange={onChange}
      name={name}
      orientation={orientation}
      isRequired={required}
      isDisabled={disabled}
      // Boolean(error), so never undefined: React Aria's own `required` check would
      // show its default message; the app owns that (component-recipe.md, rule 24).
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      className={cn('flex flex-col gap-2', className)}
    >
      <Label className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-fg-danger">
            *
          </span>
        )}
      </Label>
      {description && (
        <Text slot="description" className="-mt-1 text-sm text-fg-muted">
          {description}
        </Text>
      )}
      <div
        className={cn(
          'flex gap-x-6 gap-y-2',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        )}
      >
        {children}
      </div>
      {/* FieldError renders only while invalid, and React Aria links it to the group. */}
      <FieldError className="text-sm text-fg-danger">{error}</FieldError>
    </AriaRadioGroup>
  );
}

export type RadioProps = {
  /** The value this choice gives the group. */
  value: string;
  /** Visible text; this alone is the radio's name. */
  children: ReactNode;
  /** A second line under the label ("Billed every month"). Read as the description. */
  description?: ReactNode;
  disabled?: boolean;
};

/** One choice in a RadioGroup. */
export function Radio({ value, children, description, disabled }: RadioProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <AriaRadio
      value={value}
      isDisabled={disabled}
      // Named by the label text only; the description is read after it (see RadioCard).
      aria-labelledby={labelId}
      aria-describedby={description ? descriptionId : undefined}
      className="group flex cursor-pointer items-start gap-2 text-sm text-fg data-disabled:cursor-not-allowed data-disabled:opacity-50"
    >
      <RadioDot focusRing />
      <span className="flex flex-col">
        <span id={labelId}>{children}</span>
        {description && (
          <span id={descriptionId} className="text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </AriaRadio>
  );
}

/**
 * The circle. Needs a `group` ancestor that is a React Aria Radio (it reads
 * `data-selected` etc. from it). `focusRing`: draw the focus ring on the dot itself.
 */
function RadioDot({ focusRing = false }: { focusRing?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-strong bg-bg transition-colors',
        'group-hover:border-fg',
        'group-data-selected:border-primary group-data-selected:bg-primary',
        'group-data-invalid:border-danger',
        focusRing &&
          'group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-solid group-data-focus-visible:outline-focus-ring',
      )}
    >
      <span className="size-1.5 scale-0 rounded-full bg-on-primary transition-transform group-data-selected:scale-100" />
    </span>
  );
}

export type RadioCardProps = SelectableCardBaseProps;

/**
 * One choice in a RadioGroup, shown as a card (a plan picker, a shipping option).
 * Put several in a `RadioGroup`, usually with `orientation="horizontal"`; they share a
 * row and wrap on narrow screens. Arrow keys move *and* choose, like any radio.
 *
 * The whole card is the click target. The selected card gets a dark border and a
 * filled dot, not just color, and the focus ring goes around the whole card.
 * Named by `title` only; `description` is read after it. For "pick any", use
 * `CheckboxCard`.
 *
 * @example
 * <RadioGroup label="Plan" orientation="horizontal" defaultValue="pro">
 *   <RadioCard value="free" title="Free" description="1 user">$0</RadioCard>
 *   <RadioCard value="pro" title="Pro" description="Up to 10 users">$29/mo</RadioCard>
 * </RadioGroup>
 */
export function RadioCard({
  value,
  title,
  description,
  children,
  disabled,
  className,
}: RadioCardProps) {
  const { titleId, descriptionId, ariaProps } = useSelectableCardIds(
    Boolean(description),
  );
  return (
    <AriaRadio
      value={value}
      isDisabled={disabled}
      {...ariaProps}
      className={cn(selectableCardClasses, className)}
    >
      <RadioDot />
      <SelectableCardText
        titleId={titleId}
        descriptionId={descriptionId}
        title={title}
        description={description}
      >
        {children}
      </SelectableCardText>
    </AriaRadio>
  );
}
