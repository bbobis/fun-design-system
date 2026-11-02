import type { SVGProps } from 'react';
import { Text } from 'react-aria-components';
import { cn } from '../../utils/cn';
import type { SelectOption } from './select';

/**
 * Option lists in Select, Combobox and MultiCombobox share these sizes, so a list
 * opened from an `sm` field is as dense as the field. Rows with a description are
 * taller. Static tables: Tailwind only sees class names written out in full.
 */
export type ListSize = 'sm' | 'md' | 'lg';

/** Row heights in px. Combobox's virtualizer needs them as numbers, up front. */
export const listRowHeight = {
  plain: { sm: 28, md: 32, lg: 40 },
  described: { sm: 44, md: 48, lg: 56 },
} as const;

/** The same heights as classes. Keep in step with `listRowHeight`. */
export const listRowClass = {
  plain: { sm: 'h-7', md: 'h-8', lg: 'h-10' },
  described: { sm: 'h-11', md: 'h-12', lg: 'h-14' },
} as const;

export const listRowText: Record<ListSize, string> = {
  sm: 'px-2 text-sm',
  md: 'px-2 text-sm',
  lg: 'px-2.5 text-base',
};

/** True when any option has a second line (rows then use the taller heights). */
export const hasDescriptions = (options: readonly SelectOption[]) =>
  options.some((o) => o.description);

/**
 * What one option shows: icon, label, optional description, and a check when chosen.
 * `Text slot="label"` / `slot="description"` are React Aria slots: inside a
 * ListBoxItem they wire `aria-labelledby` and `aria-describedby` for you, so a screen
 * reader says "Admin, Can change billing and users".
 */
export function OptionContent({
  option,
  isSelected,
}: {
  option: SelectOption;
  isSelected: boolean;
}) {
  return (
    <>
      {option.icon && (
        <span
          aria-hidden="true"
          className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-full"
        >
          {option.icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <Text slot="label" className="truncate">
          {option.label}
        </Text>
        {option.description && (
          // One line, cut with "…": rows have a fixed height (virtualized lists).
          <Text
            slot="description"
            className="truncate text-xs font-normal text-fg-muted"
          >
            {option.description}
          </Text>
        )}
      </span>
      {isSelected && <CheckIcon className="size-4 shrink-0" />}
    </>
  );
}

/** Classes every option row shares (focus, selected, disabled). */
export const optionRowClass = cn(
  'flex cursor-default items-center gap-2 rounded text-fg outline-hidden',
  // data-focused = the highlighted option (keyboard or mouse).
  'data-focused:bg-surface data-selected:font-medium',
  'data-disabled:cursor-not-allowed data-disabled:text-fg-muted data-disabled:opacity-60',
);

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}
