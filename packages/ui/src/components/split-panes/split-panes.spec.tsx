import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { must } from '../../utils/must';
import { SplitPanes, type SplitPanesProps } from './split-panes';

const handle = () => screen.getByRole('separator', { name: 'Message list' });
const value = () => Number(handle().getAttribute('aria-valuenow'));
const pane = () =>
  must(document.getElementById(must(handle().getAttribute('aria-controls'))));

function Panes(props: Partial<SplitPanesProps>) {
  return (
    <SplitPanes
      separatorLabel="Message list"
      defaultSize={35}
      min={20}
      max={60}
      primary={<button type="button">In the list</button>}
      secondary={<p>Reading pane</p>}
      {...props}
    />
  );
}

describe('SplitPanes', () => {
  it('the handle is a focusable separator with a value and the pane it controls', () => {
    render(<Panes />);
    expect(handle().tabIndex).toBe(0);
    expect(value()).toBe(35);
    expect(handle().getAttribute('aria-valuemin')).toBe('20');
    expect(handle().getAttribute('aria-valuemax')).toBe('60');
    // Side-by-side panes are split by a vertical line.
    expect(handle().getAttribute('aria-orientation')).toBe('vertical');
    expect(pane().textContent).toBe('In the list');
  });

  it('←/→ move the handle by step, Shift by 4×, clamped to min / max', async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    render(<Panes onSizeChange={onSizeChange} />);
    act(() => handle().focus());
    await user.keyboard('{ArrowRight}');
    expect(value()).toBe(40);
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(value()).toBe(20);
    await user.keyboard('{ArrowLeft}');
    expect(value()).toBe(20); // min
    expect(onSizeChange).toHaveBeenLastCalledWith(20);
  });

  it('Home / End jump to min / max', async () => {
    const user = userEvent.setup();
    render(<Panes />);
    act(() => handle().focus());
    await user.keyboard('{End}');
    expect(value()).toBe(60);
    await user.keyboard('{Home}');
    expect(value()).toBe(20);
  });

  it('vertical: ↑/↓ move it, ←/→ do nothing', async () => {
    const user = userEvent.setup();
    render(<Panes orientation="vertical" />);
    expect(handle().getAttribute('aria-orientation')).toBe('horizontal');
    act(() => handle().focus());
    await user.keyboard('{ArrowRight}');
    expect(value()).toBe(35);
    await user.keyboard('{ArrowDown}');
    expect(value()).toBe(40);
  });

  it('right-to-left: → moves the handle right, which makes the (right-hand) pane smaller', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Panes />
      </div>,
    );
    act(() => handle().focus());
    await user.keyboard('{ArrowRight}');
    expect(value()).toBe(30);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(value()).toBe(40);
  });

  it('collapsible: Enter hides the pane (out of the tab order) and brings it back', async () => {
    const user = userEvent.setup();
    render(<Panes collapsible />);
    act(() => handle().focus());
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{Enter}');
    expect(value()).toBe(0);
    expect(pane().hidden).toBe(true);
    expect(handle().getAttribute('aria-valuemin')).toBe('0');
    await user.keyboard('{Enter}');
    expect(value()).toBe(40); // the size before collapsing
    expect(pane().hidden).toBe(false);
  });

  it('without collapsible, Enter does nothing', async () => {
    const user = userEvent.setup();
    render(<Panes />);
    act(() => handle().focus());
    await user.keyboard('{Enter}');
    expect(value()).toBe(35);
  });

  it('controlled: shows `size`, reports changes, waits for the parent', async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    const { rerender } = render(
      <Panes size={30} onSizeChange={onSizeChange} />,
    );
    act(() => handle().focus());
    await user.keyboard('{ArrowRight}');
    expect(onSizeChange).toHaveBeenLastCalledWith(35);
    expect(value()).toBe(30); // not until the parent passes it back
    rerender(<Panes size={35} onSizeChange={onSizeChange} />);
    expect(value()).toBe(35);
  });

  it('dragging the handle sets the size from the pointer position', () => {
    function Saved() {
      const [size, setSize] = useState(35);
      return <Panes size={size} onSizeChange={setSize} />;
    }
    render(<Saved />);
    const box = must(handle().parentElement);
    vi.spyOn(box, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 1100,
      top: 0,
      bottom: 500,
      width: 1000,
      height: 500,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.pointerDown(handle(), { button: 0, pointerId: 1, clientX: 450 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 550 });
    expect(value()).toBe(45);
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 1000 });
    expect(value()).toBe(60); // clamped to max
    fireEvent.pointerUp(handle(), { pointerId: 1, clientX: 1000 });
    fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 400 });
    expect(value()).toBe(60); // released: moving no longer resizes
  });
});
