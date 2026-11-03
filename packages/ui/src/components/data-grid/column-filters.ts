/**
 * Column filters: what a user picked in a column's "Filter…" panel. Pure functions
 * only (no React, no TanStack), so the rules are tested on their own and server mode
 * can send the same objects to an API.
 */

/** Which filter panel a column gets (`meta.filter`). */
export type DataGridFilterKind = 'text' | 'number' | 'date' | 'list';

/**
 * One column's filter. A discriminated union: `kind` says which fields exist, so
 * `switch (filter.kind)` lets TypeScript check every case is handled.
 */
export type DataGridFilter =
  /** The value contains this text (ignoring case). */
  | { kind: 'text'; contains: string }
  /** The value is between `min` and `max` (both included; either can be left out). */
  | { kind: 'number'; min?: number; max?: number }
  /** An ISO day `'YYYY-MM-DD'` between `from` and `to` (both included; either optional). */
  | { kind: 'date'; from?: string; to?: string }
  /** The value is one of these. */
  | { kind: 'list'; values: readonly string[] };

/** Every column's filter, by column id. Columns without a filter aren't listed. */
export type DataGridFilters = Readonly<Record<string, DataGridFilter>>;

export const NO_FILTERS: DataGridFilters = {};

/** Does the filter actually narrow anything? An empty one is the same as none. */
export function isActiveFilter(f: DataGridFilter | undefined): boolean {
  if (!f) return false;
  switch (f.kind) {
    case 'text':
      return f.contains.trim() !== '';
    case 'number':
      return f.min !== undefined || f.max !== undefined;
    case 'date':
      return Boolean(f.from || f.to);
    case 'list':
      return f.values.length > 0;
  }
}

/** Does a cell's value pass the filter? Empty cells only pass an inactive filter. */
export function matchesFilter(value: unknown, f: DataGridFilter): boolean {
  if (!isActiveFilter(f)) return true;
  if (value == null || value === '') return false;
  switch (f.kind) {
    case 'text':
      return String(value)
        .toLowerCase()
        .includes(f.contains.trim().toLowerCase());
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) return false;
      return (
        (f.min === undefined || n >= f.min) &&
        (f.max === undefined || n <= f.max)
      );
    }
    case 'date': {
      // ISO days compare correctly as text: '2026-01-31' < '2026-02-01'.
      const day = String(value).slice(0, 10);
      return (!f.from || day >= f.from) && (!f.to || day <= f.to);
    }
    case 'list':
      return f.values.includes(String(value));
  }
}

/** Sets one column's filter; an inactive one removes the column from the object. */
export function setFilter(
  filters: DataGridFilters,
  columnId: string,
  f: DataGridFilter | null,
): DataGridFilters {
  const { [columnId]: _old, ...rest } = filters;
  return f && isActiveFilter(f) ? { ...rest, [columnId]: f } : rest;
}

/** The distinct values of a column, sorted, for a `list` filter without `options`. */
export function distinctValues(
  values: Iterable<unknown>,
  limit = 200,
): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    if (v == null || v === '') continue;
    seen.add(String(v));
    if (seen.size > limit) break;
  }
  return [...seen].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

/**
 * A short summary for the chip: "Paid, Pending", "1,000 – 5,000", "≥ 1,000",
 * "contains "rock"", "from 2026-01-01". `format` shows numbers the way the app does.
 */
export function describeFilter(
  f: DataGridFilter,
  format: (n: number) => string = (n) => n.toLocaleString(),
): string {
  switch (f.kind) {
    case 'text':
      return `contains “${f.contains.trim()}”`;
    case 'number':
      if (f.min !== undefined && f.max !== undefined)
        return `${format(f.min)} – ${format(f.max)}`;
      return f.min !== undefined
        ? `≥ ${format(f.min)}`
        : `≤ ${format(f.max ?? 0)}`;
    case 'date':
      if (f.from && f.to) return `${f.from} – ${f.to}`;
      return f.from ? `from ${f.from}` : `until ${f.to ?? ''}`;
    case 'list': {
      const shown = f.values.slice(0, 2).join(', ');
      const more = f.values.length - 2;
      return more > 0 ? `${shown} +${more}` : shown;
    }
  }
}

/** TanStack's `columnFilters` state from ours. */
export function toColumnFilters(filters: DataGridFilters) {
  return Object.entries(filters).map(([id, value]) => ({ id, value }));
}
