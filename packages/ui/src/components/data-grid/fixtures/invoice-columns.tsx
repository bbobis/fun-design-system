import { Badge } from '../../badge';
import { createDataGridColumnHelper } from '../data-grid-features';
import type { Invoice } from './invoices';

const col = createDataGridColumnHelper<Invoice>();

// Formatters are created once, not per cell: creating Intl objects is slow.
const money = new Intl.NumberFormat('en-CA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const tone = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'danger',
  Draft: 'neutral',
} as const;

/** 20 columns, defined once at module scope so the reference is stable. */
export const invoiceColumns = col.columns([
  col.accessor('number', {
    header: 'Invoice',
    size: 120,
    meta: { mono: true },
  }),
  col.accessor('customer', { header: 'Customer', size: 200 }),
  col.accessor('status', {
    header: 'Status',
    size: 110,
    cell: (info) => (
      <Badge tone={tone[info.getValue()]}>{info.getValue()}</Badge>
    ),
  }),
  col.accessor('issued', {
    header: 'Issued',
    size: 110,
    sortFn: 'datetime',
    cell: (i) => date.format(i.getValue()),
    meta: { align: 'end' },
  }),
  col.accessor('due', {
    header: 'Due',
    size: 110,
    sortFn: 'datetime',
    cell: (i) => date.format(i.getValue()),
    meta: { align: 'end' },
  }),
  col.accessor('subtotal', {
    header: 'Subtotal',
    size: 120,
    cell: (i) => money.format(i.getValue()),
    meta: { align: 'end' },
  }),
  col.accessor('tax', {
    header: 'Tax',
    size: 100,
    cell: (i) => money.format(i.getValue()),
    meta: { align: 'end' },
  }),
  col.accessor('total', {
    header: 'Total',
    size: 120,
    cell: (i) => money.format(i.getValue()),
    meta: { align: 'end' },
  }),
  col.accessor('currency', { header: 'Cur.', size: 70, meta: { mono: true } }),
  col.accessor('region', { header: 'Region', size: 100 }),
  col.accessor('country', { header: 'Country', size: 110 }),
  col.accessor('city', { header: 'City', size: 120 }),
  col.accessor('salesRep', { header: 'Sales rep', size: 130 }),
  col.accessor('terms', { header: 'Terms', size: 130 }),
  col.accessor('poNumber', {
    header: 'PO number',
    size: 120,
    meta: { mono: true },
  }),
  col.accessor('category', { header: 'Category', size: 120 }),
  col.accessor('items', { header: 'Items', size: 80, meta: { align: 'end' } }),
  col.accessor('marginPct', {
    header: 'Margin %',
    size: 100,
    cell: (i) => i.getValue().toFixed(1),
    meta: { align: 'end' },
  }),
  col.accessor('daysOutstanding', {
    header: 'Days out',
    size: 100,
    meta: { align: 'end' },
  }),
  col.accessor('id', { header: 'Record ID', size: 110, meta: { mono: true } }),
]);
