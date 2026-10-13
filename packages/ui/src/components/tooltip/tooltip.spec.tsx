import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../button';
import { Tooltip } from './tooltip';

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));
const button = () => screen.getByRole('button', { name: 'Export' });
/** React Aria tracks *how* focus arrives: a key press first means "keyboard". */
function keyboardFocus(el: HTMLElement) {
  act(() => {
    fireEvent.keyDown(document.body, { key: 'Tab' });
    fireEvent.keyUp(document.body, { key: 'Tab' });
  });
  act(() => el.focus());
}

function Example({ disabled }: { disabled?: boolean }) {
  return (
    <Tooltip content="Export as CSV" delay={0} disabled={disabled}>
      <Button intent="ghost" aria-label="Export">
        ⤓
      </Button>
    </Tooltip>
  );
}

describe('Tooltip', () => {
  it('keyboard focus shows it; the button is described by it (not named by it)', async () => {
    render(<Example />);
    keyboardFocus(button());
    await wait(10);
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toBe('Export as CSV');
    expect(button().getAttribute('aria-describedby')).toBe(tip.id);
    // The name stays the button's own aria-label.
    expect(screen.getByRole('button', { name: 'Export' })).toBe(button());
  });

  it('hovering with the mouse shows it, leaving hides it', async () => {
    render(<Example />);
    // React Aria only treats hover as real once it has seen the mouse in use (in a
    // browser, moving it is enough). A fresh test page has no history, so click once.
    act(() => {
      fireEvent.pointerDown(document.body, { pointerType: 'mouse' });
      fireEvent.pointerUp(document.body, { pointerType: 'mouse' });
    });
    // React's onPointerEnter / onPointerLeave are built from pointerover / pointerout.
    fireEvent.pointerOver(button(), { pointerType: 'mouse' });
    await wait(10);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.pointerOut(button(), { pointerType: 'mouse' });
    await wait(400); // closeDelay
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('Escape hides it', async () => {
    render(<Example />);
    keyboardFocus(button());
    await wait(10);
    act(() => {
      fireEvent.keyDown(button(), { key: 'Escape' });
    });
    await wait(10);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('focus from a mouse click does not show it (only keyboard focus does)', async () => {
    render(<Example />);
    act(() => {
      fireEvent.pointerDown(button(), { pointerType: 'mouse' });
      fireEvent.mouseDown(button());
    });
    act(() => button().focus());
    await wait(10);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('disabled: never shows', async () => {
    render(<Example disabled />);
    keyboardFocus(button());
    fireEvent.pointerOver(button(), { pointerType: 'mouse' });
    await wait(10);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('Tooltip kind="label"', () => {
  it('shows the text but hides it from the description', async () => {
    render(
      <Tooltip content="Export" delay={0} kind="label">
        <Button intent="ghost" aria-label="Export">
          ⤓
        </Button>
      </Tooltip>,
    );
    keyboardFocus(button());
    await wait(10);
    const tip = screen.getByRole('tooltip');
    // Seen on screen…
    expect(tip.textContent).toBe('Export');
    // …but its text sits in an aria-hidden child: a description skips hidden
    // children of the element aria-describedby points to, so it comes out empty.
    expect(tip.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(tip.firstElementChild?.textContent).toBe('Export');
  });
});
