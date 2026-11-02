import { render, screen, within } from '@testing-library/react';
import { DataGrid, type DataGridProps } from './data-grid';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

const data = makeInvoices(6);
const grid = (props: Partial<DataGridProps<Invoice>> = {}) =>
  render(
    <DataGrid<Invoice>
      aria-label="Invoices"
      data={data}
      columns={invoiceColumns}
      getRowId={(r) => r.id}
      {...props}
    />,
  );
const bodyRows = () =>
  within(screen.getByRole('table')).getAllByRole('row').slice(1); // skip the header

// jsdom has no layout, so the virtualizer renders nothing unless it's given a size.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 800,
  });
});

describe('DataGrid styles', () => {
  it('defaults: compact rows, no stripes, no cell lines, nothing pinned', () => {
    grid();
    const [first, second] = bodyRows();
    expect(first.getAttribute('style')).toContain('--row-h: 32px');
    expect(second.className).not.toContain('bg-surface/60');
    expect(first.querySelector('td')?.className).not.toContain('border-e');
    expect(first.querySelector('td')?.className).not.toContain('sticky');
  });

  it('density="comfortable" is 48px', () => {
    grid({ density: 'comfortable' });
    expect(bodyRows()[0].getAttribute('style')).toContain('--row-h: 48px');
  });

  it('striped fills odd data rows (by index, not DOM order)', () => {
    grid({ striped: true });
    const rows = bodyRows();
    expect(rows[0].getAttribute('data-index')).toBe('0');
    expect(rows[0].className).not.toContain('bg-surface/60');
    expect(rows[1].className).toContain('bg-surface/60');
  });

  it('gridLines="all" adds lines between cells, in the header too', () => {
    grid({ gridLines: 'all' });
    expect(bodyRows()[0].querySelector('td')?.className).toContain('border-e');
    expect(screen.getAllByRole('columnheader')[0].className).toContain(
      'border-e',
    );
  });

  it('pinFirstColumn pins the checkbox and the first data column, with offsets', () => {
    grid({ pinFirstColumn: true, enableRowSelection: true });
    const [select, first, second] = Array.from(
      bodyRows()[0].querySelectorAll('td'),
    );
    expect(select.className).toContain('sticky');
    expect(select.getAttribute('style')).toContain('--pin: 0px');
    expect(first.className).toContain('sticky');
    expect(first.getAttribute('style')).toMatch(/--pin: [1-9]\d*px/);
    // Only the last pinned cell draws the edge line.
    expect(select.className).not.toContain('after:bg-border-strong');
    expect(first.className).toContain('after:bg-border-strong');
    expect(second.className).not.toContain('sticky');
    // Header cells pin the same way.
    const headers = screen.getAllByRole('columnheader');
    expect(headers[1].className).toContain('sticky');
  });

  it('the prediction: the scroll box keeps cells clear of the pinned columns', () => {
    grid({ pinFirstColumn: true });
    const scroller = screen.getByRole('table').parentElement as HTMLElement;
    expect(scroller.className).toContain('scroll-ps-(--pin-w)');
    expect(scroller.getAttribute('style')).toMatch(/--pin-w: [1-9]\d*px/);
  });

  it('pinned cells use solid fills, so scrolled cells never show through', () => {
    grid({ pinFirstColumn: true, striped: true });
    const pinnedOdd = bodyRows()[1].querySelector('td') as HTMLElement;
    expect(pinnedOdd.className).toContain(
      'bg-[color-mix(in_oklab,var(--color-surface)_60%,var(--color-bg))]',
    );
    expect(pinnedOdd.className).not.toMatch(/(^| )bg-surface\/60( |$)/);
  });
});
