import { useId } from 'react';
import { Button } from '../button';
import { Select } from '../select';
import { cn } from '../../utils/cn';

export type PaginationProps = {
  /** The current page, starting at 1. */
  page: number;
  /**
   * How many pages there are. With 1 or fewer, the page buttons are hidden (and, without
   * a page-size picker, nothing is shown).
   */
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
  /** Rows per page. Set it together with `onPageSizeChange` to show the picker. */
  pageSize?: number;
  /**
   * The sizes to choose from.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: readonly number[];
  /**
   * Shows a "Rows per page" picker. Called with the new size and the page that keeps
   * the first row you were looking at on screen (page 5 of 25s → page 3 of 50s).
   * Set both: `setPageSize(size); setPage(page);`
   */
  onPageSizeChange?: (pageSize: number, page: number) => void;
  className?: string;
};

/**
 * The page that still shows the first row of `page` after switching to `newSize`, so
 * the user doesn't lose their place. Rows 101–125 (page 5 of 25s) → page 3 of 50s
 * (rows 101–150).
 */
export function pageForSize(page: number, oldSize: number, newSize: number) {
  const firstRow = (page - 1) * oldSize; // 0-based index of the first visible row
  return Math.floor(firstRow / newSize) + 1;
}

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
 * - With `pageSize` + `onPageSizeChange`, a "Rows per page" picker shows beside it.
 *
 * @example
 * <Pagination page={page} pageCount={42} onChange={setPage} />
 *
 * @example With a page-size picker
 * <Pagination
 *   page={page} pageCount={Math.ceil(total / size)} onChange={setPage}
 *   pageSize={size}
 *   onPageSizeChange={(newSize, newPage) => { setSize(newSize); setPage(newPage); }}
 * />
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  siblings = 1,
  'aria-label': ariaLabel = 'Pagination',
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  className,
}: PaginationProps) {
  const sizeLabelId = useId();
  const picker =
    pageSize !== undefined && onPageSizeChange ? (
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <span id={sizeLabelId}>Rows per page</span>
        <Select
          aria-labelledby={sizeLabelId}
          size="sm"
          className="w-20"
          options={pageSizeOptions.map((n) => ({
            value: String(n),
            label: String(n),
          }))}
          value={String(pageSize)}
          onChange={(v) => {
            const next = Number(v);
            if (v === null || next === pageSize) return;
            onPageSizeChange(next, pageForSize(page, pageSize, next));
          }}
        />
      </div>
    ) : null;

  if (pageCount <= 1) {
    return picker && <div className={className}>{picker}</div>;
  }
  const current = Math.min(Math.max(page, 1), pageCount);
  const atStart = current === 1;
  const atEnd = current === pageCount;
  const go = (to: number) => {
    if (to !== current) onChange(to);
  };

  const nav = (
    <nav aria-label={ariaLabel} className={picker ? undefined : className}>
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

  if (!picker) return nav;
  // The picker sits outside the <nav>: choosing a page size isn't navigation.
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-6 gap-y-3',
        className,
      )}
    >
      {picker}
      {nav}
    </div>
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
