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

describe('Toast styles', () => {
  const toastEl = async (title: string) =>
    (await screen.findByText(title)).closest<HTMLElement>(
      '[role="alertdialog"]',
    );

  it('bar is the default: a white card with a coloured bar (unchanged)', async () => {
    render(<ToastRegion />);
    act(() => void track(toast.success('Saved')));
    const el = await toastEl('Saved');
    expect(el?.className).toContain('bg-bg');
    expect(el?.querySelector('span[aria-hidden].w-1')).toBeTruthy();
  });

  it('variant is set once on the region and applies to every toast (the prediction)', async () => {
    render(<ToastRegion variant="solid" />);
    act(() => {
      track(toast.success('One'));
      track(toast.danger('Two'));
    });
    for (const t of ['One', 'Two']) {
      const el = await toastEl(t);
      expect(el?.className).toContain('bg-(--toast-solid)');
      expect(el?.querySelector('span.w-1')).toBeNull(); // no bar
    }
    // Each keeps its own tone's colors.
    expect((await toastEl('Two'))?.className).toContain(
      '--toast-solid:var(--color-danger)',
    );
  });

  it('on a coloured fill, description, action and × follow the toast text colour', async () => {
    render(<ToastRegion variant="soft" />);
    act(
      () =>
        void track(
          toast.show({
            title: 'Deleted 3 rows',
            description: 'From the March batch.',
            tone: 'warning',
            action: { label: 'Undo', onAction: () => undefined },
          }),
        ),
    );
    await screen.findByText('Deleted 3 rows');
    expect(screen.getByText('From the March batch.').className).toContain(
      'text-current',
    );
    expect(screen.getByRole('button', { name: 'Undo' }).className).toContain(
      'decoration-current',
    );
    expect(screen.getByRole('button', { name: 'Close' }).className).toContain(
      'text-current',
    );
  });

  it('size sm is tighter; the tone is still said in words', async () => {
    render(<ToastRegion size="sm" variant="outline" />);
    act(() => void track(toast.warning('Stale rates')));
    const el = await toastEl('Stale rates');
    expect(el?.className).toContain('p-2');
    expect(el?.className).toContain('border-(--toast-strong)');
    expect(el?.textContent).toContain('Warning: Stale rates');
  });
});

it('the region shows a focus ring when F6 lands on it (WCAG 2.4.7)', () => {
  const { container } = render(<ToastRegion />);
  act(() => void track(toast.success('Saved')));
  const region = document.querySelector('[role="region"]') ?? container;
  expect((region as HTMLElement).className).toContain(
    'data-focus-visible:outline-focus-ring',
  );
});
