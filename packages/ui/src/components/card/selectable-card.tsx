import { useId, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { cardVariants } from './card';

/*
 * Internal parts shared by RadioCard and CheckboxCard (not exported from the package).
 * The two stay separate components because they *mean* different things (pick one vs
 * pick any); only the look and the naming wiring are shared.
 */

/** Props both selectable cards take. */
export type SelectableCardBaseProps = {
  /** The value this card gives the group. */
  value: string;
  /** The card's title. This alone is the control's name ("Pro"). */
  title: ReactNode;
  /** A muted line under the title. Read as the control's description. */
  description?: ReactNode;
  /** Extra content: a price, a feature list. Visible, but not read with the name. */
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
};

/**
 * The card look, driven by React Aria's data attributes. The element must also have
 * `group` so the indicator (dot or box) can follow its state.
 */
export const selectableCardClasses = cn(
  cardVariants({ padding: 'sm' }),
  'group flex cursor-pointer items-start gap-3 transition-colors',
  // In a horizontal group, cards share the row equally and wrap below ~12rem.
  // (Only there: in a column, a flex-basis would set the card's *height*.)
  'in-data-[orientation=horizontal]:min-w-48 in-data-[orientation=horizontal]:flex-[1_1_12rem]',
  'hover:border-border-strong',
  // Not color alone, and not yellow (1.7:1 on white): a dark border + 1px ring.
  'data-selected:border-fg data-selected:ring-1 data-selected:ring-fg',
  'data-invalid:border-danger',
  'data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
  'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:border-border',
);

/**
 * Ids for the title and description, and the ARIA props that use them. React Aria's
 * Radio and Checkbox are a `<label>` around everything, so by default the name would
 * be ALL the text inside (title, description, price). This names the control by its
 * title only and describes it with the description.
 */
export function useSelectableCardIds(hasDescription: boolean) {
  const titleId = useId();
  const descriptionId = useId();
  return {
    titleId,
    descriptionId,
    ariaProps: {
      'aria-labelledby': titleId,
      'aria-describedby': hasDescription ? descriptionId : undefined,
    },
  };
}

/** The text column: title, description, extra content. */
export function SelectableCardText({
  titleId,
  descriptionId,
  title,
  description,
  children,
}: {
  titleId: string;
  descriptionId: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-1 text-sm">
      <span id={titleId} className="font-medium text-fg">
        {title}
      </span>
      {description && (
        <span id={descriptionId} className="text-fg-muted">
          {description}
        </span>
      )}
      {children && <span className="mt-1 text-fg">{children}</span>}
    </span>
  );
}
