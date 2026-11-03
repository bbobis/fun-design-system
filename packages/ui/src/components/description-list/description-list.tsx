import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { useCopy } from '../../utils/use-copy';
import {
  CopyStateIcon,
  CopyStatus,
  copyStateClass,
} from '../copy-field/copy-parts';

export type DescriptionListLayout = 'horizontal' | 'vertical' | 'grid';
export type DescriptionListSize = 'sm' | 'md';

type ListStyle = {
  layout: DescriptionListLayout;
  size: DescriptionListSize;
  divided: boolean;
};
const ListContext = createContext<ListStyle>({
  layout: 'horizontal',
  size: 'md',
  divided: false,
});

export type DescriptionListProps = Omit<ComponentProps<'dl'>, 'children'> & {
  /**
   * - `horizontal`: label left, value right; stacks when the box is narrower than
   *   28rem (a container query: it follows the box, so it works in a Drawer too).
   * - `vertical`: label above value, one item per row.
   * - `grid`: stacked items; 2 columns from a 24rem-wide box, 3 from 48rem.
   * @default 'horizontal'
   */
  layout?: DescriptionListLayout;
  /** A line between items. @default false */
  divided?: boolean;
  /** @default 'md' */
  size?: DescriptionListSize;
  children?: ReactNode;
};

/** Gaps between items when they aren't divided. */
const gap: Record<DescriptionListLayout, string> = {
  horizontal: 'gap-3',
  vertical: 'gap-4',
  grid: 'gap-x-6 gap-y-4',
};

/**
 * Label / value pairs for a detail page: an invoice's number, customer, dates, status.
 * A `<dl>`: each DescriptionItem is a `<dt>` (label) and `<dd>` (value), wrapped in a
 * `<div>`, so screen readers pair them.
 *
 * @example
 * <DescriptionList divided>
 *   <DescriptionItem label="Invoice number" copy="INV-1044">INV-1044</DescriptionItem>
 *   <DescriptionItem label="Due">Nov 15, 2026</DescriptionItem>
 * </DescriptionList>
 */
export function DescriptionList({
  layout = 'horizontal',
  divided = false,
  size = 'md',
  className,
  children,
  ...rest
}: DescriptionListProps) {
  return (
    // The container query context: items read this box's width, not the window's.
    <div className="@container">
      <dl
        {...rest}
        className={cn(
          layout === 'grid'
            ? 'grid grid-cols-1 @sm:grid-cols-2 @3xl:grid-cols-3'
            : 'flex flex-col',
          // Divided: no gap; each item draws the line under itself (grid: none).
          divided
            ? layout === 'grid'
              ? 'gap-x-6'
              : 'divide-y divide-border'
            : gap[layout],
          'text-sm',
          className,
        )}
      >
        <ListContext.Provider value={{ layout, size, divided }}>
          {children}
        </ListContext.Provider>
      </dl>
    </div>
  );
}

export type DescriptionItemProps = {
  /** The label ("Invoice number"). Also names the copy button ("Copy Invoice number"). */
  label: string;
  /**
   * The value. Empty (`undefined`, `null`, `''`) shows "—", which screen readers hear
   * as "None": a lone dash is read as "dash", or skipped.
   */
  children?: ReactNode;
  /**
   * Adds a copy button that copies this text (the value as plain text: an id, an
   * email, an IBAN). Says "Copied" to screen readers when it worked.
   */
  copy?: string;
  /** In `layout="grid"`: `full` takes a whole row (notes, addresses). @default 1 */
  span?: 1 | 'full';
  /** Text shown for an empty value. @default '—' */
  emptyText?: string;
  className?: string;
};

const isEmpty = (v: ReactNode) =>
  v === undefined || v === null || v === false || v === '';

const pad: Record<DescriptionListSize, string> = { sm: 'py-2', md: 'py-3' };

/** One label / value pair in a DescriptionList. */
export function DescriptionItem({
  label,
  children,
  copy,
  span = 1,
  emptyText = '—',
  className,
}: DescriptionItemProps) {
  const { layout, size, divided } = useContext(ListContext);
  const horizontal = layout === 'horizontal';
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1',
        // Side by side from 28rem of box width (@md); a fixed label column.
        horizontal && '@md:flex-row @md:items-baseline @md:gap-4',
        // Divided lists have no gap, so each item pads itself (around its line).
        divided && pad[size],
        layout === 'grid' && span === 'full' && 'col-span-full',
        className,
      )}
    >
      <dt
        className={cn(
          'text-fg-muted',
          horizontal && '@md:w-44 @md:shrink-0',
          size === 'sm' && 'text-xs',
        )}
      >
        {label}
      </dt>
      <dd className="flex min-w-0 flex-1 items-start gap-2 text-fg">
        <span className="min-w-0 break-words">
          {isEmpty(children) ? (
            <>
              <span aria-hidden="true" className="text-fg-muted">
                {emptyText}
              </span>
              <span className="sr-only">None</span>
            </>
          ) : (
            children
          )}
        </span>
        {copy !== undefined && <CopyButton text={copy} label={label} />}
      </dd>
    </div>
  );
}

/** The copy button after a value. Logic and pieces shared with CopyField. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const { state, copy } = useCopy();
  return (
    <>
      <button
        type="button"
        // Names the button with its label, so a list of copy buttons isn't
        // "Copy, Copy, Copy" in a screen reader's list of buttons.
        aria-label={`Copy ${label}`}
        onClick={() => void copy(text)}
        className={cn(
          '-my-0.5 flex size-6 shrink-0 items-center justify-center rounded text-fg-muted hover:bg-surface hover:text-fg',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-focus-ring',
          copyStateClass(state),
        )}
      >
        <CopyStateIcon state={state} className="size-3.5" />
      </button>
      <CopyStatus state={state} />
    </>
  );
}
