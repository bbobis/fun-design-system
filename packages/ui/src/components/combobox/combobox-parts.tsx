import type { SVGProps } from 'react';
import {
  ListBox,
  ListBoxItem,
  ListLayout,
  Popover,
  Virtualizer,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import type { SelectOption } from '../select';

/** Row height in px. Fixed, so the virtualizer can place 10,000 rows without measuring. */
const ROW_HEIGHT = 32;

/**
 * The dropdown shared by Combobox and MultiCombobox: a popover as wide as the field,
 * holding a virtualized list. It reads the options and selection from the surrounding
 * React Aria `ComboBox` (through context), so it takes no items itself.
 */
export function ComboboxPopover({
  loading,
  emptyMessage,
}: {
  loading: boolean;
  emptyMessage: string;
}) {
  return (
    <Popover
      offset={4}
      className="w-(--trigger-width) min-w-40 rounded-md border border-border bg-bg shadow-lg"
    >
      {/*
        React Aria's own virtualizer: only the visible rows are in the DOM. Rows must be
        ROW_HEIGHT tall (h-8 below) so the layout's maths matches what's drawn.
      */}
      <Virtualizer
        layout={ListLayout}
        layoutOptions={{ rowHeight: ROW_HEIGHT, padding: 4 }}
      >
        <ListBox<SelectOption>
          className="max-h-72 overflow-auto outline-hidden"
          renderEmptyState={() => (
            <p className="px-3 py-2 text-sm text-fg-muted">
              {loading ? 'Loading…' : emptyMessage}
            </p>
          )}
        >
          {(option) => (
            <ListBoxItem
              id={option.value}
              textValue={option.label}
              className={cn(
                'mx-1 flex h-8 cursor-default items-center justify-between gap-2 rounded px-2 text-sm text-fg outline-hidden',
                'data-focused:bg-surface data-selected:font-medium',
                'data-disabled:cursor-not-allowed data-disabled:text-fg-muted data-disabled:opacity-60',
              )}
            >
              {({ isSelected }) => (
                <>
                  <span className="truncate">{option.label}</span>
                  {isSelected && <CheckIcon className="size-4 shrink-0" />}
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Virtualizer>
    </Popover>
  );
}

export function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

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

export function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      {...props}
    >
      <path d="M8 2a6 6 0 1 0 6 6" />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      {...props}
    >
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </svg>
  );
}
