import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast, ToastRegion } from './toast';

// The queue is app-wide, so every test closes what it opened.
const opened: string[] = [];
const track = (key: string) => {
  opened.push(key);
  return key;
};
afterEach(() => {
  act(() => opened.splice(0).forEach((k) => toast.dismiss(k)));
});

describe('Toast', () => {
  it('the region appears with the first toast: a landmark named after the count', () => {
    render(<ToastRegion />);
    expect(screen.queryByRole('region')).toBeNull(); // nothing to show yet
    act(() => void track(toast.show({ title: 'Hello' })));
    expect(
      screen.getByRole('region', { name: /1 notification/i }),
    ).toBeTruthy();
    // Each toast is a non-modal alertdialog named by its title; its text is an alert.
    expect(screen.getByRole('alertdialog', { name: 'Hello' })).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('shows a toast with title and description, and says its tone in words', () => {
    render(<ToastRegion />);
    act(
      () =>
        void track(
          toast.danger('Couldn’t save', {
            description: 'The server didn’t respond.',
          }),
        ),
    );
    expect(screen.getByText('The server didn’t respond.')).toBeTruthy();
    expect(
      screen.getByText('Couldn’t save', { exact: false }).textContent,
    ).toBe('Error: Couldn’t save');
  });

  it('the × closes it', async () => {
    render(<ToastRegion />);
    act(() => void track(toast.success('Invoice saved')));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Invoice saved')).toBeNull());
  });

  it('closes by itself after the timeout', async () => {
    render(<ToastRegion />);
    act(() => void track(toast.info('Synced', {}, { timeout: 50 })));
    expect(screen.getByText('Synced', { exact: false })).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByText('Synced', { exact: false })).toBeNull(),
    );
  });

  it('an action runs, then closes the toast; toasts with actions do not time out', async () => {
    const undo = vi.fn();
    const onClose = vi.fn();
    render(<ToastRegion />);
    act(
      () =>
        void track(
          toast.show(
            {
              title: 'Deleted 3 rows',
              action: { label: 'Undo', onAction: undo },
            },
            { onClose },
          ),
        ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText('Deleted 3 rows')).toBeNull(),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('toast.dismiss closes one early', async () => {
    render(<ToastRegion />);
    let key = '';
    act(() => {
      key = track(toast.show({ title: 'Uploading…' }, { timeout: null }));
    });
    act(() => toast.dismiss(key));
    await waitFor(() => expect(screen.queryByText('Uploading…')).toBeNull());
  });
});
