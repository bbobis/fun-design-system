import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { TagGroup, type TagItem } from './tag-group';

const filters: TagItem[] = [
  { id: 'status', label: 'Status: Open' },
  { id: 'owner', label: 'Owner: Me' },
  { id: 'due', label: 'Due: This week' },
];
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key });
    fireEvent.keyUp(document.activeElement as Element, { key });
  });
const row = (name: string) => screen.getByRole('row', { name });

function Removable({ onRemove }: { onRemove?: (ids: string[]) => void }) {
  const [items, setItems] = useState(filters);
  return (
    <TagGroup
      label="Active filters"
      items={items}
      emptyText="No filters"
      onRemove={(ids) => {
        onRemove?.(ids);
        setItems((current) => current.filter((i) => !ids.includes(i.id)));
      }}
    />
  );
}

describe('TagGroup', () => {
  it('is a grid named by its label, one row per chip', () => {
    render(<TagGroup label="Active filters" items={filters} />);
    expect(screen.getByRole('grid', { name: 'Active filters' })).toBeTruthy();
    expect(screen.getAllByRole('row').map((r) => r.textContent)).toEqual([
      'Status: Open',
      'Owner: Me',
      'Due: This week',
    ]);
    // Not removable: no ✕ buttons.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('hideLabel keeps the name for screen readers', () => {
    render(<TagGroup label="Active filters" hideLabel items={filters} />);
    expect(screen.getByRole('grid', { name: 'Active filters' })).toBeTruthy();
    expect(screen.getByText('Active filters').className).toContain('sr-only');
  });

  it('onRemove: a named ✕ per chip removes it', () => {
    const onRemove = vi.fn();
    render(<Removable onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: /Remove Owner: Me/ }));
    expect(onRemove).toHaveBeenLastCalledWith(['owner']);
    expect(screen.queryByRole('row', { name: 'Owner: Me' })).toBeNull();
  });

  it('the ✕ shows a focus ring (outline-hidden needs outline-solid to come back)', () => {
    render(<Removable />);
    const x = screen.getByRole('button', { name: /Remove Status: Open/ });
    for (const c of [
      'data-focus-visible:outline-2',
      'data-focus-visible:outline-solid',
      'data-focus-visible:outline-focus-ring',
    ])
      expect(x.className).toContain(c);
  });

  it('keyboard: ←/→ move between chips, Delete removes and focus moves to the next', () => {
    render(<Removable />);
    act(() => row('Status: Open').focus());
    press('ArrowRight');
    expect(document.activeElement).toBe(row('Owner: Me'));
    press('Delete');
    expect(screen.queryByRole('row', { name: 'Owner: Me' })).toBeNull();
    expect(document.activeElement).toBe(row('Due: This week'));
  });

  it('removing the last chip shows the empty text and keeps focus on the list', () => {
    render(<Removable />);
    act(() => row('Status: Open').focus());
    press('Backspace');
    press('Backspace');
    press('Backspace');
    expect(screen.queryAllByRole('row')).toHaveLength(0);
    expect(screen.getByText('No filters')).toBeTruthy();
    // Not <body>: the (now empty) list itself, still named "Active filters".
    expect(document.activeElement).not.toBe(document.body);
    expect(
      document.activeElement?.getAttribute('aria-labelledby'),
    ).toBeTruthy();
  });

  it('selectionMode="multiple": toggles with a click and Space; disabled chips are skipped', () => {
    const onSelectionChange = vi.fn();
    render(
      <TagGroup
        label="Status"
        items={[...filters, { id: 'void', label: 'Void', disabled: true }]}
        selectionMode="multiple"
        defaultSelectedIds={['status']}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(row('Status: Open').getAttribute('aria-selected')).toBe('true');
    fireEvent.click(row('Owner: Me'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(['status', 'owner']);
    act(() => row('Status: Open').focus());
    press(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(['owner']);
    expect(row('Void').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(row('Void'));
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
  });

  it('description and error are linked to the grid', () => {
    render(
      <TagGroup
        label="Recipients"
        items={filters}
        description="People who get the report"
        error="Add someone from Finance"
      />,
    );
    const grid = screen.getByRole('grid', { name: 'Recipients' });
    const text = (grid.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
      .join(' | ');
    expect(text).toContain('People who get the report');
    expect(text).toContain('Add someone from Finance');
  });
});
