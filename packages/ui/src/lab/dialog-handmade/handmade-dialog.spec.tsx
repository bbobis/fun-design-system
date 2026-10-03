import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Button } from '../../components/button';
import { HandmadeDialog } from './handmade-dialog';

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete invoice</Button>
      <HandmadeDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete INV-10242?"
        description="This can't be undone."
      >
        <div className="mt-4 flex justify-end gap-2">
          <Button intent="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button intent="danger" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </div>
      </HandmadeDialog>
    </>
  );
}

function openDialog() {
  const trigger = screen.getByRole('button', { name: 'Delete invoice' });
  trigger.focus();
  act(() => fireEvent.click(trigger));
  return { trigger, dialog: screen.getByRole('dialog') };
}

describe('HandmadeDialog (lab)', () => {
  it('renders nothing while closed', () => {
    render(<Demo />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has the ARIA contract: modal, named by its title, described by its text', () => {
    render(<Demo />);
    const { dialog } = openDialog();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Delete INV-10242?' })).toBe(
      dialog,
    );
    const descId = dialog.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(descId)?.textContent).toBe(
      "This can't be undone.",
    );
  });

  it('moves focus into the dialog when it opens', () => {
    render(<Demo />);
    openDialog();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Cancel' }),
    );
  });

  it('traps Tab: last wraps to first, Shift+Tab on first wraps to last', () => {
    render(<Demo />);
    const { dialog } = openDialog();
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const del = screen.getByRole('button', { name: 'Delete' });

    del.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(cancel);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(del);
  });

  it('closes on Esc and returns focus to the button that opened it', () => {
    render(<Demo />);
    const { dialog, trigger } = openDialog();
    act(() => fireEvent.keyDown(dialog, { key: 'Escape' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a backdrop click', () => {
    render(<Demo />);
    openDialog();
    act(() => fireEvent.click(screen.getByTestId('dialog-backdrop')));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('makes the page behind inert and locks scroll, then undoes both on close', () => {
    const { container } = render(<Demo />);
    const { dialog } = openDialog();
    expect(container.hasAttribute('inert')).toBe(true);
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    act(() => fireEvent.keyDown(dialog, { key: 'Escape' }));
    expect(container.hasAttribute('inert')).toBe(false);
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });
});
