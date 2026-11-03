import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { must } from '../../utils/must';
import { AnnouncementBar } from './announcement-bar';

const KEY = 'fds:announcement-dismissed:maintenance';

function Page({ withRef = false }: { withRef?: boolean }) {
  const target = createRef<HTMLButtonElement>();
  return (
    <>
      <AnnouncementBar
        dismissKey="maintenance"
        returnFocus={withRef ? target : undefined}
        action={<a href="#status">Status page</a>}
      >
        Maintenance Sunday 2–4 AM.
      </AnnouncementBar>
      <button type="button">Open navigation</button>
      <button type="button" ref={target}>
        Search
      </button>
    </>
  );
}

describe('AnnouncementBar', () => {
  beforeEach(() => window.localStorage.clear());

  it('is a landmark named "Announcement", not a live region', () => {
    render(<Page />);
    const bar = screen.getByRole('region', { name: 'Announcement' });
    expect(bar.tagName).toBe('SECTION');
    expect(bar.getAttribute('aria-live')).toBeNull();
    expect(bar.getAttribute('role')).toBeNull();
    expect(bar.textContent).toContain('Maintenance Sunday');
  });

  it('dismissing hides it, remembers it, and it stays gone after a reload', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Page />);
    await user.click(
      screen.getByRole('button', { name: 'Dismiss announcement' }),
    );
    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBe('1');
    unmount();
    render(<Page />); // "reload"
    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull();
  });

  it('the prediction: focus moves to the next focusable element, not <body>', async () => {
    const user = userEvent.setup();
    render(<Page />);
    must(screen.getByRole('button', { name: 'Dismiss announcement' })).focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Open navigation' }),
    );
  });

  it('skips hidden elements (like the ☰ button on wide screens)', async () => {
    const user = userEvent.setup();
    render(<Page />);
    const nav = screen.getByRole('button', { name: 'Open navigation' });
    // jsdom has no layout; stand in for the browser's answer.
    nav.checkVisibility = () => false;
    await user.click(
      screen.getByRole('button', { name: 'Dismiss announcement' }),
    );
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Search' }),
    );
  });

  it('returnFocus picks where focus goes instead', async () => {
    const user = userEvent.setup();
    render(<Page withRef />);
    await user.click(
      screen.getByRole('button', { name: 'Dismiss announcement' }),
    );
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Search' }),
    );
  });

  it('blocked storage: still shows and still dismisses (just not remembered)', async () => {
    const user = userEvent.setup();
    const get = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    render(<Page />);
    await user.click(
      screen.getByRole('button', { name: 'Dismiss announcement' }),
    );
    expect(screen.queryByRole('region', { name: 'Announcement' })).toBeNull();
    get.mockRestore();
    set.mockRestore();
  });

  it('no dismissKey and no onDismiss: no × button', () => {
    render(<AnnouncementBar>Hello</AnnouncementBar>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('onDismiss alone: dismissible for this visit, and told about it', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<AnnouncementBar onDismiss={onDismiss}>Hello</AnnouncementBar>);
    await user.click(
      screen.getByRole('button', { name: 'Dismiss announcement' }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(window.localStorage.length).toBe(0);
  });

  it('inverse tone sets data-inverse (opposite theme inside)', () => {
    render(
      <AnnouncementBar tone="inverse">New: recurring invoices</AnnouncementBar>,
    );
    expect(screen.getByRole('region').getAttribute('data-inverse')).toBe(
      'true',
    );
  });
});
