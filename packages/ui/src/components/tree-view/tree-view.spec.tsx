import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TreeView, type TreeNode } from './tree-view';

const nodes: TreeNode[] = [
  {
    id: 'billing',
    label: 'Billing',
    children: [
      { id: 'inv-1', label: 'INV-1.pdf' },
      { id: 'inv-2', label: 'INV-2.pdf' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    children: [{ id: 'acme', label: 'Acme.csv' }],
  },
  { id: 'old', label: 'Old.zip', disabled: true },
];

const row = (name: string) =>
  screen.getByRole('row', { name: new RegExp(`^${name}`) });
const focusedRow = () =>
  (document.activeElement as HTMLElement).closest('[role=row]');

describe('TreeView', () => {
  it('is a named treegrid; folders say whether they are open, rows say their level', () => {
    render(
      <TreeView
        aria-label="Files"
        nodes={nodes}
        defaultExpanded={['billing']}
      />,
    );
    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeTruthy();
    expect(row('Billing').getAttribute('aria-expanded')).toBe('true');
    expect(row('Customers').getAttribute('aria-expanded')).toBe('false');
    expect(row('INV-1.pdf').getAttribute('aria-level')).toBe('2');
    // Children of closed folders aren't rendered.
    expect(screen.queryByRole('row', { name: /Acme/ })).toBeNull();
  });

  it('→ opens a folder, ← closes it, and ← on a child goes up to its parent', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <TreeView
        aria-label="Files"
        nodes={nodes}
        onExpandedChange={onExpandedChange}
      />,
    );
    await user.tab();
    expect(focusedRow()).toBe(row('Billing'));
    await user.keyboard('{ArrowRight}');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['billing']);
    expect(row('Billing').getAttribute('aria-expanded')).toBe('true');
    // React Aria's Tree is a treegrid: ↓ steps into the folder (→ again stays put).
    await user.keyboard('{ArrowDown}');
    expect(focusedRow()).toBe(row('INV-1.pdf'));
    await user.keyboard('{ArrowLeft}');
    expect(focusedRow()).toBe(row('Billing'));
    await user.keyboard('{ArrowLeft}');
    expect(row('Billing').getAttribute('aria-expanded')).toBe('false');
  });

  it('the chevron toggles a folder with the mouse, and is not a Tab stop', async () => {
    const user = userEvent.setup();
    render(<TreeView aria-label="Files" nodes={nodes} />);
    const chevron = row('Customers').querySelector(
      '[slot="chevron"]',
    ) as HTMLElement;
    expect(chevron.getAttribute('tabindex')).toBe('-1');
    await user.click(chevron);
    expect(row('Customers').getAttribute('aria-expanded')).toBe('true');
  });

  it('selectionMode="none": Enter or a click runs onAction', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <TreeView
        aria-label="Files"
        nodes={nodes}
        defaultExpanded={['billing']}
        onAction={onAction}
      />,
    );
    await user.click(row('INV-2.pdf'));
    expect(onAction).toHaveBeenLastCalledWith('inv-2');
    await user.keyboard('{ArrowUp}{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('inv-1');
  });

  it('selectionMode="single": a click selects (with a ✓), Enter opens', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onAction = vi.fn();
    render(
      <TreeView
        aria-label="Files"
        nodes={nodes}
        defaultExpanded={['billing']}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
        onAction={onAction}
      />,
    );
    await user.click(row('INV-2.pdf'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['inv-2']);
    expect(row('INV-2.pdf').getAttribute('aria-selected')).toBe('true');
    expect(row('INV-2.pdf').querySelector('svg path[d^="m3.5"]')).toBeTruthy();
    expect(onAction).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('inv-2');
  });

  it('selectionMode="multiple": a checkbox per row; checking more keeps the rest', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TreeView
        aria-label="Files"
        nodes={nodes}
        defaultExpanded={['billing']}
        selectionMode="multiple"
        defaultSelected={['inv-1']}
        onSelectionChange={onSelectionChange}
      />,
    );
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes.length).toBeGreaterThanOrEqual(4);
    await user.click(row('INV-2.pdf'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['inv-1', 'inv-2']);
  });

  it('a disabled row cannot be selected', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TreeView
        aria-label="Files"
        nodes={nodes}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(row('Old.zip').getAttribute('aria-disabled')).toBe('true');
    await user.click(row('Old.zip'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('shows the empty state when there are no nodes', () => {
    render(
      <TreeView aria-label="Files" nodes={[]} emptyState="No files yet." />,
    );
    expect(screen.getByText('No files yet.')).toBeTruthy();
  });

  it('the focus ring has a style, not just a width (outline-hidden sets it to none)', () => {
    render(<TreeView aria-label="Files" nodes={nodes} />);
    // Real visibility is checked in Chromium; this guards the class that was missing.
    expect(row('Billing').className).toContain(
      'data-focus-visible:outline-solid',
    );
  });
});
