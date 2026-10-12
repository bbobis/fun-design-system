import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  moveItems,
  ReorderableList,
  type ReorderableItem,
} from './reorderable-list';

const columns: ReorderableItem[] = [
  { id: 'invoice', label: 'Invoice' },
  { id: 'customer', label: 'Customer', description: 'Company name' },
  { id: 'status', label: 'Status' },
  { id: 'due', label: 'Due date' },
];
const ids = (items: readonly { id: string }[]) => items.map((i) => i.id);

describe('moveItems', () => {
  it('moves one item before or after a target', () => {
    expect(ids(moveItems(columns, ['due'], 'customer', 'before'))).toEqual([
      'invoice',
      'due',
      'customer',
      'status',
    ]);
    expect(ids(moveItems(columns, ['invoice'], 'status', 'after'))).toEqual([
      'customer',
      'status',
      'invoice',
      'due',
    ]);
  });

  it('moves several items together, keeping their order', () => {
    expect(
      ids(moveItems(columns, ['due', 'invoice'], 'status', 'before')),
    ).toEqual(['customer', 'invoice', 'due', 'status']);
  });

  it('dropping on itself or an unknown target changes nothing', () => {
    expect(ids(moveItems(columns, ['status'], 'status', 'after'))).toEqual(
      ids(columns),
    );
    expect(ids(moveItems(columns, ['status'], 'nope', 'after'))).toEqual(
      ids(columns),
    );
  });
});

function Columns({
  onReorder,
}: {
  onReorder?: (i: ReorderableItem[]) => void;
}) {
  const [items, setItems] = useState(columns);
  return (
    <ReorderableList
      aria-label="Column order"
      items={items}
      onReorder={(next) => {
        setItems(next);
        onReorder?.(next);
      }}
    />
  );
}
const press = (key: string, altKey = false) =>
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key, altKey });
    fireEvent.keyUp(document.activeElement as Element, { key, altKey });
  });

describe('ReorderableList', () => {
  it('is a named grid; each row has a named drag handle and its description', () => {
    render(<Columns />);
    expect(screen.getByRole('grid', { name: 'Column order' })).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Drag Due date/ })).toBeTruthy();
    // The second line is part of the row's name, read after the label.
    expect(
      screen.getByRole('row', { name: 'Customer, Company name' }),
    ).toBeTruthy();
  });

  // The drag itself (mouse and keyboard) is verified in real Chromium: React Aria's
  // drag manager needs layout, which jsdom doesn't have, so a drag never starts here.
  it('↑↓ move between rows and → reaches the drag handle (the first steps of a keyboard move)', () => {
    render(<Columns />);
    const due = screen.getByRole('row', { name: 'Due date' });
    act(() => due.focus());
    press('ArrowUp');
    expect(document.activeElement).toBe(
      screen.getByRole('row', { name: 'Status' }),
    );
    press('ArrowRight');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Drag Status' }),
    );
  });

  describe('Alt+↑/↓ shortcut', () => {
    const focusRow = (name: string) =>
      act(() => screen.getByRole('row', { name }).focus());

    it('moves the focused row one step, announces it, and keeps focus on it', () => {
      const onReorder = vi.fn();
      render(<Columns onReorder={onReorder} />);
      focusRow('Status');
      press('ArrowDown', true);
      expect(ids(onReorder.mock.lastCall?.[0])).toEqual([
        'invoice',
        'customer',
        'due',
        'status',
      ]);
      expect(screen.getByRole('status').textContent).toBe(
        'Moved Status to position 4 of 4.',
      );
      press('ArrowUp', true);
      press('ArrowUp', true);
      expect(ids(onReorder.mock.lastCall?.[0])).toEqual([
        'invoice',
        'status',
        'customer',
        'due',
      ]);
      expect(screen.getByRole('status').textContent).toBe(
        'Moved Status to position 2 of 4.',
      );
      expect(document.activeElement).toBe(
        screen.getByRole('row', { name: 'Status' }),
      );
    });

    it('also works from the drag handle', () => {
      const onReorder = vi.fn();
      render(<Columns onReorder={onReorder} />);
      act(() => screen.getByRole('button', { name: 'Drag Invoice' }).focus());
      press('ArrowDown', true);
      expect(ids(onReorder.mock.lastCall?.[0])).toEqual([
        'customer',
        'invoice',
        'status',
        'due',
      ]);
    });

    it('at the ends: no change, and says why', () => {
      const onReorder = vi.fn();
      render(<Columns onReorder={onReorder} />);
      focusRow('Invoice');
      press('ArrowUp', true);
      expect(onReorder).not.toHaveBeenCalled();
      expect(screen.getByRole('status').textContent).toBe(
        'Invoice is already first.',
      );
    });

    it('plain ↓ still just moves focus; disabled ignores the shortcut', () => {
      const onReorder = vi.fn();
      const { unmount } = render(<Columns onReorder={onReorder} />);
      focusRow('Invoice');
      press('ArrowDown');
      expect(onReorder).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(
        screen.getByRole('row', { name: 'Customer, Company name' }),
      );
      unmount();

      render(
        <ReorderableList
          aria-label="Column order"
          items={columns}
          onReorder={onReorder}
          disabled
        />,
      );
      focusRow('Invoice');
      press('ArrowDown', true);
      expect(onReorder).not.toHaveBeenCalled();
    });
  });
});
