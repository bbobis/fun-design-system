import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Button } from '../button';
import { AlertDialog, Dialog, type AlertDialogProps } from './dialog';

/** React Aria restores focus (and runs some cleanup) on the next animation frame. */
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key });
    fireEvent.keyUp(document.activeElement ?? document.body, { key });
  });

function EditDialog({ dismissable }: { dismissable?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit invoice</Button>
      <Button>Elsewhere</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit invoice"
        description="Changes are saved when you press Save."
        dismissable={dismissable}
        footer={
          <>
            <Button intent="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        <input aria-label="Customer" />
      </Dialog>
    </>
  );
}

function openFromTrigger(name: string) {
  const trigger = screen.getByRole('button', { name });
  act(() => trigger.focus()); // as a keyboard user would
  fireEvent.click(trigger);
  return trigger;
}

describe('Dialog', () => {
  it('is named by its title and described by its description', () => {
    render(<EditDialog />);
    openFromTrigger('Edit invoice');
    const dialog = screen.getByRole('dialog', { name: 'Edit invoice' });
    const describedBy = dialog.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe(
      'Changes are saved when you press Save.',
    );
  });

  it('moves focus inside, and hides the page behind from screen readers', async () => {
    render(<EditDialog />);
    openFromTrigger('Edit invoice');
    await nextFrame(); // React Aria moves focus in on the next frame
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    // The page behind is aria-hidden: only the dialog's buttons are reachable.
    expect(screen.queryByRole('button', { name: 'Elsewhere' })).toBeNull();
  });

  it('Escape closes it and focus goes back to the button that opened it', async () => {
    render(<EditDialog />);
    const trigger = openFromTrigger('Edit invoice');
    await nextFrame();
    press('Escape');
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('the × button closes it', async () => {
    render(<EditDialog />);
    openFromTrigger('Edit invoice');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dismissable={false}: a click on the dimmed page does not close it', async () => {
    render(<EditDialog dismissable={false} />);
    openFromTrigger('Edit invoice');
    const overlay = screen.getByRole('dialog').closest('.fixed') as Element;
    act(() => {
      fireEvent.pointerDown(overlay);
      fireEvent.pointerUp(overlay);
      fireEvent.click(overlay);
    });
    await nextFrame();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

function Confirm(props: Partial<AlertDialogProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete</Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete 3 invoices?"
        description="This can't be undone."
        confirmLabel="Delete invoices"
        onConfirm={() => undefined}
        {...props}
      />
    </>
  );
}

describe('AlertDialog', () => {
  it('is an alertdialog and starts focus on Cancel (the safe choice)', () => {
    render(<Confirm />);
    openFromTrigger('Delete');
    expect(
      screen.getByRole('alertdialog', { name: 'Delete 3 invoices?' }),
    ).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Cancel' }),
    );
  });

  it('confirm runs onConfirm and closes', async () => {
    const onConfirm = vi.fn();
    render(<Confirm onConfirm={onConfirm} />);
    openFromTrigger('Delete');
    fireEvent.click(screen.getByRole('button', { name: 'Delete invoices' }));
    await nextFrame();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('an async onConfirm shows a spinner, blocks Escape, and closes when it resolves', async () => {
    let finish!: () => void;
    const onConfirm = () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      });
    render(<Confirm onConfirm={onConfirm} />);
    openFromTrigger('Delete');
    const confirm = screen.getByRole('button', { name: 'Delete invoices' });
    fireEvent.click(confirm);
    expect(confirm.getAttribute('aria-busy')).toBe('true');
    press('Escape'); // the outcome is unknown while it runs: stay open
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    await act(async () => finish());
    await nextFrame();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('a rejected onConfirm keeps the dialog open', async () => {
    const onConfirm = () => Promise.reject(new Error('Server down'));
    render(<Confirm onConfirm={onConfirm} />);
    openFromTrigger('Delete');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete invoices' }));
    });
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Delete invoices' })
        .getAttribute('aria-busy'),
    ).toBeNull();
  });

  it('a click outside does not close it; Escape means Cancel', async () => {
    const onConfirm = vi.fn();
    render(<Confirm onConfirm={onConfirm} />);
    const trigger = openFromTrigger('Delete');
    const overlay = screen
      .getByRole('alertdialog')
      .closest('.fixed') as Element;
    act(() => {
      fireEvent.pointerDown(overlay);
      fireEvent.pointerUp(overlay);
      fireEvent.click(overlay);
    });
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    press('Escape');
    await nextFrame();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
  });
});
