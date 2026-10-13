import {
  createContext,
  useContext,
  type ComponentProps,
  type ElementType,
} from 'react';
import { cn } from '../../utils/cn';

/*
 * Every class below is written out in full on purpose. Tailwind finds the classes to
 * generate by scanning source *text*, so `grid-cols-${n}` would produce no CSS at all.
 *
 * Breakpoints are container queries (`@min-[48rem]:`), not screen widths (`md:`): a
 * Bento responds to the space it's given, so the same layout works full-page, in a
 * Drawer or in a Card. The widths match Tailwind's screen breakpoints.
 */
const BREAKPOINTS = ['base', 'sm', 'md', 'lg', 'xl'] as const;
type Breakpoint = (typeof BREAKPOINTS)[number];

/**
 * A value per container width, mobile-first: each size inherits the one before it.
 * `{ base: 1, md: 2 }` = 1 below 48rem, 2 from 48rem up. A plain number means "always".
 */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

/** `COLUMNS.md[1]` = 2 columns from 48rem of *container* width. */
const COLUMNS = {
  base: [
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
  ],
  sm: [
    '@min-[40rem]:grid-cols-1',
    '@min-[40rem]:grid-cols-2',
    '@min-[40rem]:grid-cols-3',
    '@min-[40rem]:grid-cols-4',
    '@min-[40rem]:grid-cols-5',
    '@min-[40rem]:grid-cols-6',
  ],
  md: [
    '@min-[48rem]:grid-cols-1',
    '@min-[48rem]:grid-cols-2',
    '@min-[48rem]:grid-cols-3',
    '@min-[48rem]:grid-cols-4',
    '@min-[48rem]:grid-cols-5',
    '@min-[48rem]:grid-cols-6',
  ],
  lg: [
    '@min-[64rem]:grid-cols-1',
    '@min-[64rem]:grid-cols-2',
    '@min-[64rem]:grid-cols-3',
    '@min-[64rem]:grid-cols-4',
    '@min-[64rem]:grid-cols-5',
    '@min-[64rem]:grid-cols-6',
  ],
  xl: [
    '@min-[80rem]:grid-cols-1',
    '@min-[80rem]:grid-cols-2',
    '@min-[80rem]:grid-cols-3',
    '@min-[80rem]:grid-cols-4',
    '@min-[80rem]:grid-cols-5',
    '@min-[80rem]:grid-cols-6',
  ],
} as const;

/** Column spans, same shape as COLUMNS. */
const SPANS = {
  base: [
    'col-span-1',
    'col-span-2',
    'col-span-3',
    'col-span-4',
    'col-span-5',
    'col-span-6',
  ],
  sm: [
    '@min-[40rem]:col-span-1',
    '@min-[40rem]:col-span-2',
    '@min-[40rem]:col-span-3',
    '@min-[40rem]:col-span-4',
    '@min-[40rem]:col-span-5',
    '@min-[40rem]:col-span-6',
  ],
  md: [
    '@min-[48rem]:col-span-1',
    '@min-[48rem]:col-span-2',
    '@min-[48rem]:col-span-3',
    '@min-[48rem]:col-span-4',
    '@min-[48rem]:col-span-5',
    '@min-[48rem]:col-span-6',
  ],
  lg: [
    '@min-[64rem]:col-span-1',
    '@min-[64rem]:col-span-2',
    '@min-[64rem]:col-span-3',
    '@min-[64rem]:col-span-4',
    '@min-[64rem]:col-span-5',
    '@min-[64rem]:col-span-6',
  ],
  xl: [
    '@min-[80rem]:col-span-1',
    '@min-[80rem]:col-span-2',
    '@min-[80rem]:col-span-3',
    '@min-[80rem]:col-span-4',
    '@min-[80rem]:col-span-5',
    '@min-[80rem]:col-span-6',
  ],
} as const;

/** Row spans, same shape as COLUMNS. */
const ROWS = {
  base: ['row-span-1', 'row-span-2', 'row-span-3', 'row-span-4'],
  sm: [
    '@min-[40rem]:row-span-1',
    '@min-[40rem]:row-span-2',
    '@min-[40rem]:row-span-3',
    '@min-[40rem]:row-span-4',
  ],
  md: [
    '@min-[48rem]:row-span-1',
    '@min-[48rem]:row-span-2',
    '@min-[48rem]:row-span-3',
    '@min-[48rem]:row-span-4',
  ],
  lg: [
    '@min-[64rem]:row-span-1',
    '@min-[64rem]:row-span-2',
    '@min-[64rem]:row-span-3',
    '@min-[64rem]:row-span-4',
  ],
  xl: [
    '@min-[80rem]:row-span-1',
    '@min-[80rem]:row-span-2',
    '@min-[80rem]:row-span-3',
    '@min-[80rem]:row-span-4',
  ],
} as const;

const GAPS = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' } as const;
// Every row is at least this tall; content can make it taller.
const ROW_HEIGHTS = {
  auto: 'auto-rows-auto',
  sm: 'auto-rows-[minmax(6rem,auto)]',
  md: 'auto-rows-[minmax(10rem,auto)]',
  lg: 'auto-rows-[minmax(14rem,auto)]',
} as const;

/** `{ base: 1, md: 2 }` → `[1, 1, 2, 2, 2]`: one value per breakpoint, inherited upward. */
export function resolve(
  value: Responsive<number> | undefined,
  fallback: number,
): number[] {
  if (value === undefined || typeof value === 'number') {
    return BREAKPOINTS.map(() => value ?? fallback);
  }
  let current = value.base ?? fallback;
  return BREAKPOINTS.map((bp) => (current = value[bp] ?? current));
}

const clamp = (n: number, max: number) =>
  Math.min(Math.max(1, Math.round(n)), max);

/** One class per breakpoint where the value changes (the rest inherit it). */
function classes(
  table: Record<Breakpoint, readonly string[]>,
  values: number[],
): string[] {
  return BREAKPOINTS.flatMap((bp, i) =>
    i > 0 && values[i] === values[i - 1] ? [] : [table[bp][values[i] - 1]],
  );
}

/** Column counts per breakpoint, so tiles can cap their span (see BentoTile). */
const BentoColumns = createContext<number[]>(BREAKPOINTS.map(() => 1));

type BentoElement = 'div' | 'section' | 'ul';

export type BentoProps = {
  /**
   * Columns per container width, 1–6. Mobile-first.
   * @default { base: 1, md: 2, lg: 4 }
   */
  columns?: Responsive<number>;
  /** Space between tiles. @default 'md' */
  gap?: keyof typeof GAPS;
  /** The smallest row height; tiles with `rows={2}` take two. @default 'md' */
  rowHeight?: keyof typeof ROW_HEIGHTS;
  /**
   * `ul` when the tiles are a list of like things (cards), then use `as="li"` on tiles.
   * @default 'div'
   */
  as?: BentoElement;
} & ComponentProps<'div'>;

/**
 * A "lunchbox" layout: tiles of different sizes in one tidy grid that reflows as space
 * shrinks. It's layout only: put a Card (or anything) in each `BentoTile`.
 *
 * Responds to **its own width** (container queries), not the screen's, so it works
 * full-page, in a Drawer or in a split view. Tiles always keep their source order on
 * screen: Tab order and screen readers follow the DOM, so nothing jumps around.
 *
 * @example
 * <Bento columns={{ base: 1, md: 2, lg: 4 }}>
 *   <BentoTile span={{ md: 2 }} rows={2}><Card className="h-full">Revenue</Card></BentoTile>
 *   <BentoTile><Card className="h-full">Invoices</Card></BentoTile>
 * </Bento>
 */
export function Bento({
  columns = { base: 1, md: 2, lg: 4 },
  gap = 'md',
  rowHeight = 'md',
  as,
  className,
  children,
  ...rest
}: BentoProps) {
  const cols = resolve(columns, 1).map((n) => clamp(n, 6));
  const Component = (as ?? 'div') as ElementType;
  return (
    // The container query context lives on this wrapper; the grid inside measures it.
    <div className="@container">
      <Component
        className={cn(
          'grid list-none p-0',
          GAPS[gap],
          ROW_HEIGHTS[rowHeight],
          classes(COLUMNS, cols),
          className,
        )}
        {...rest}
      >
        <BentoColumns.Provider value={cols}>{children}</BentoColumns.Provider>
      </Component>
    </div>
  );
}

type TileElement = 'div' | 'li' | 'article' | 'section';

export type BentoTileProps = {
  /**
   * Columns this tile covers, per container width. Capped at the Bento's column count
   * at each width, so a wide tile never pushes the grid off the side.
   * @default 1
   */
  span?: Responsive<number>;
  /** Rows this tile covers (1–4), per container width. @default 1 */
  rows?: Responsive<number>;
  /** @default 'div' (use 'li' inside `<Bento as="ul">`) */
  as?: TileElement;
} & ComponentProps<'div'>;

/** One cell of a Bento. Its child should fill it (`h-full`) to line tiles up. */
export function BentoTile({
  span,
  rows,
  as,
  className,
  ...rest
}: BentoTileProps) {
  const cols = useContext(BentoColumns);
  const spans = resolve(span, 1).map((n, i) => clamp(n, cols[i]));
  const rowSpans = resolve(rows, 1).map((n) => clamp(n, 4));
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component
      className={cn(
        'min-w-0',
        classes(SPANS, spans),
        classes(ROWS, rowSpans),
        className,
      )}
      {...rest}
    />
  );
}
