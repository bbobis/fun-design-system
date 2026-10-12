import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../button';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from './toolbar';

const press = (key: string, init: Partial<KeyboardEventInit> = {}) =>
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key, ...init });
    fireEvent.keyUp(document.activeElement as Element, { key, ...init });
  });
const button = (name: string) => screen.getByRole('button', { name });

function Actions({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <Toolbar aria-label="Invoice actions" orientation={orientation}>
      <ToolbarGroup aria-label="Edit">
        <Button>New</Button>
        <Button>Duplicate</Button>
      </ToolbarGroup>
      <ToolbarSeparator />
      <Button>Export</Button>
    </Toolbar>
  );
}

describe('Toolbar', () => {
  it('is a named toolbar with a named group inside', () => {
    render(<Actions />);
    const toolbar = screen.getByRole('toolbar', { name: 'Invoice actions' });
    expect(toolbar.getAttribute('aria-orientation')).toBe('horizontal');
    expect(screen.getByRole('group', { name: 'Edit' })).toBeTruthy();
  });

  it('←/→ move between controls, across groups and separators', () => {
    render(<Actions />);
    act(() => button('New').focus());
    press('ArrowRight');
    expect(document.activeElement).toBe(button('Duplicate'));
    press('ArrowRight');
    expect(document.activeElement).toBe(button('Export'));
    press('ArrowLeft');
    expect(document.activeElement).toBe(button('Duplicate'));
  });

  it('vertical: ↑/↓ move instead', () => {
    render(<Actions orientation="vertical" />);
    act(() => button('New').focus());
    press('ArrowDown');
    expect(document.activeElement).toBe(button('Duplicate'));
    press('ArrowUp');
    expect(document.activeElement).toBe(button('New'));
  });

  it('the separator runs across the toolbar, and says so', () => {
    const { unmount } = render(<Actions />);
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe(
      'vertical',
    );
    unmount();
    // In a vertical toolbar it's a horizontal <hr> (its default orientation).
    render(<Actions orientation="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep.tagName).toBe('HR');
    expect(sep.getAttribute('aria-orientation')).not.toBe('vertical');
  });
});
