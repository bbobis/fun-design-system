import { matchesFilter } from '../column-filters';
import type { DataGridQuery } from '../server-query';
import type { Invoice } from './invoices';

/** The page shape a Spring `PagedModel` sends (see docs/data-grid-server.md). */
export type Page<T> = {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

/**
 * A pretend server for stories and tests: filters, searches, sorts and pages `all`
 * the way a backend would, using the same filter rules as the grid. A real app
 * sends the query over HTTP instead (docs/data-grid-server.md).
 */
export function queryInvoices(
  all: readonly Invoice[],
  q: DataGridQuery,
): Page<Invoice> {
  const field = (row: Invoice, id: string) =>
    (row as Record<string, unknown>)[id];
  const search = q.search.trim().toLowerCase();
  let rows = all.filter(
    (row) =>
      Object.entries(q.filters).every(([id, f]) =>
        matchesFilter(field(row, id), f),
      ) &&
      (!search ||
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(search),
        )),
  );
  if (q.sort.length) {
    rows = [...rows].sort((a, b) => {
      for (const { id, desc } of q.sort) {
        const x = field(a, id);
        const y = field(b, id);
        const c =
          typeof x === 'number' && typeof y === 'number'
            ? x - y
            : String(x).localeCompare(String(y), undefined, { numeric: true });
        if (c) return desc ? -c : c;
      }
      return 0;
    });
  }
  const start = q.pageIndex * q.pageSize;
  return {
    content: rows.slice(start, start + q.pageSize),
    page: {
      size: q.pageSize,
      number: q.pageIndex,
      totalElements: rows.length,
      totalPages: Math.ceil(rows.length / q.pageSize),
    },
  };
}
