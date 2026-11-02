import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type SVGProps,
} from 'react';
import { cn } from '../../utils/cn';

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

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Copies `text`. `navigator.clipboard` only exists on https (and localhost), can be
 * blocked by the browser or by an iframe's permissions, and returns a Promise that
 * may reject: so failure is a real state, shown and announced, not ignored.
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = async () => {
    clearTimeout(timer.current);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard not available');
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    // Back to the copy icon after 2 s (the message stays long enough to be read).
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  return (
    <>
      <button
        type="button"
        // Names the button with its label, so a list of copy buttons isn't
        // "Copy, Copy, Copy" in a screen reader's list of buttons.
        aria-label={`Copy ${label}`}
        onClick={() => void onCopy()}
        className={cn(
          '-my-0.5 flex size-6 shrink-0 items-center justify-center rounded text-fg-muted hover:bg-surface hover:text-fg',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-focus-ring',
          state === 'copied' && 'text-success hover:text-success',
          state === 'failed' && 'text-danger hover:text-danger',
        )}
      >
        {state === 'copied' ? (
          <CheckIcon className="size-3.5" />
        ) : state === 'failed' ? (
          <AlertIcon className="size-3.5" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
      </button>
      {/* Always in the DOM, so screen readers notice when its text changes. */}
      <span role="status" className="sr-only">
        {state === 'copied'
          ? 'Copied'
          : state === 'failed'
            ? 'Couldn’t copy. Select the text and copy it yourself.'
            : ''}
      </span>
    </>
  );
}

function Svg(props: SVGProps<SVGSVGElement>) {
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
    />
  );
}
const CopyIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="5.25" y="5.25" width="8" height="8.5" rx="1.5" />
    <path d="M10.75 5.25V3.75a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v6a1.5 1.5 0 0 0 1.5 1.5h1.5" />
  </Svg>
);
const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={2}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Svg>
);
const AlertIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 4.75v3.75M8 11h.01" />
  </Svg>
);
