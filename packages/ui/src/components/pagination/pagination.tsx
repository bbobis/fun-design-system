import { Button } from '../button';

export type PaginationProps = {
  /** The current page, starting at 1. */
  page: number;
  /** How many pages there are. With 1 or fewer, nothing is shown. */
  pageCount: number;
  /** Called with the page the user picked (1-based). */
  onChange: (page: number) => void;
  /**
   * How many page numbers to show on each side of the current one.
   * @default 1
   */
  siblings?: number;
  /**
   * Names the `<nav>` landmark. Give each one its own name if a page has two
   * ("Invoices pages", "Payments pages").
   * @default 'Pagination'
   */
  'aria-label'?: string;
  className?: string;
};

/** A page number, or a gap ("…") between two page numbers. */
export type PageItem = number | 'gap';

/**
 * Which page numbers to show. Always the first, the last, and `siblings` either side
 * of the current page, with "…" for what's skipped. The number of items stays the
 * same as you move, so the buttons don't jump around under the mouse.
 *
 * @example pageItems(5, 10, 1) → [1, 'gap', 4, 5, 6, 'gap', 10]
 */
export function pageItems(
  page: number,
  pageCount: number,
  siblings = 1,
): PageItem[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);
  // first + last + current + siblings on both sides + two gaps
  const slots = 2 * siblings + 5;
  if (pageCount <= slots) return range(1, pageCount);

  const edge = slots - 2; // pages shown at one end when only one gap is needed
  if (page - siblings <= 3) return [...range(1, edge), 'gap', pageCount];
  if (page + siblings >= pageCount - 2)
    return [1, 'gap', ...range(pageCount - edge + 1, pageCount)];
  return [
    1,
    'gap',
    ...range(page - siblings, page + siblings),
    'gap',
    pageCount,
  ];
}

/**
 * Previous / page numbers / Next, for moving through a long list one page at a time.
 * Controlled only: the page lives with the code that fetches the data.
 *
 * - A `<nav>` landmark; the current page is marked `aria-current="page"`.
 * - Each number is a button named "Page 4", so a screen reader doesn't just say "4".
 * - At the first or last page, Previous / Next stay visible but `aria-disabled`, not
 *   `disabled`: a `disabled` button drops focus, so pressing Next onto the last page
 *   would throw keyboard users back to the top of the document.
 *
 * @example
 * <Pagination page={page} pageCount={42} onChange={setPage} />
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  siblings = 1,
  'aria-label': ariaLabel = 'Pagination',
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const current = Math.min(Math.max(page, 1), pageCount);
  const atStart = current === 1;
  const atEnd = current === pageCount;
  const go = (to: number) => {
    if (to !== current) onChange(to);
  };

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <Button
            intent="ghost"
            size="sm"
            aria-disabled={atStart || undefined}
            onClick={() => !atStart && go(current - 1)}
            className="px-2"
          >
            <ChevronIcon className="size-4 rotate-180 rtl:rotate-0" />
            Previous
          </Button>
        </li>
        {pageItems(current, pageCount, siblings).map((item, i) =>
          item === 'gap' ? (
            // Purely visual; the page buttons around it already say which pages exist.
            <li
              key={`gap-${i}`}
              aria-hidden="true"
              className="flex w-8 justify-center text-fg-muted"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Button
                intent={item === current ? 'primary' : 'ghost'}
                size="sm"
                aria-label={`Page ${item}`}
                aria-current={item === current ? 'page' : undefined}
                onClick={() => go(item)}
                className="min-w-8 px-2 tabular-nums"
              >
                {item}
              </Button>
            </li>
          ),
        )}
        <li>
          <Button
            intent="ghost"
            size="sm"
            aria-disabled={atEnd || undefined}
            onClick={() => !atEnd && go(current + 1)}
            className="px-2"
          >
            Next
            <ChevronIcon className="size-4 rtl:rotate-180" />
          </Button>
        </li>
      </ul>
    </nav>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
  );
}
