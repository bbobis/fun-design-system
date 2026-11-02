import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeMailbox } from './mail-data';
import {
  markedMessage,
  pageOf,
  selectAllState,
  unreadCounts,
  visibleMessages,
} from './mail-logic';
import { MailPage } from './mail-page';

const mailbox = makeMailbox();

describe('mail logic', () => {
  it('visibleMessages: folder, then search (sender, subject, preview), then unread only', () => {
    expect(visibleMessages(mailbox, 'inbox', '', false)).toHaveLength(60);
    expect(visibleMessages(mailbox, 'sent', '', false)).toHaveLength(2);
    expect(
      visibleMessages(mailbox, 'inbox', 'ana ruiz', false).every(
        (m) => m.from === 'Ana Ruiz',
      ),
    ).toBe(true);
    expect(
      visibleMessages(mailbox, 'inbox', '', true).every((m) => m.unread),
    ).toBe(true);
  });

  it('pageOf: the slice, a clamped page and the range text', () => {
    const items = Array.from({ length: 60 }, (_, i) => i);
    expect(pageOf(items, 1, 25).range).toBe('1–25 of 60');
    const last = pageOf(items, 9, 25); // past the end → last page
    expect(last.page).toBe(3);
    expect(last.range).toBe('51–60 of 60');
    expect(pageOf([], 1, 25).range).toBe('0 of 0');
  });

  it('selectAllState: all, some or none of the page', () => {
    expect(selectAllState(['a', 'b'], ['a', 'b', 'z'])).toBe('all');
    expect(selectAllState(['a', 'b'], ['b'])).toBe('some');
    expect(selectAllState(['a', 'b'], ['z'])).toBe('none');
  });

  it('markedMessage and unreadCounts', () => {
    expect(markedMessage(1, true)).toBe('1 conversation marked as read.');
    expect(markedMessage(3, false)).toBe('3 conversations marked as unread.');
    expect(unreadCounts(mailbox).inbox).toBe(20);
  });
});

const grid = () => screen.getByRole('grid', { name: 'Inbox' });
const rows = () => within(grid()).getAllByRole('row');
const pageCheckbox = () =>
  screen.getByRole('checkbox', {
    name: 'Select all on this page',
  }) as HTMLInputElement;

describe('MailPage', () => {
  it('shows the inbox: 25 rows on page 1, range text, folders with unread counts', () => {
    render(<MailPage />);
    expect(rows()).toHaveLength(25);
    expect(screen.getByText('1–25 of 60')).toBeTruthy();
    const folders = screen.getByRole('navigation', { name: 'Folders' });
    expect(
      within(folders).getByRole('link', { name: 'Inbox, 20 unread' }),
    ).toBeTruthy();
  });

  it('the page checkbox: empty → all (checked) → none; one tick makes it the dash', async () => {
    const user = userEvent.setup();
    render(<MailPage />);
    await user.click(pageCheckbox());
    expect(
      rows().every((r) => r.getAttribute('aria-selected') === 'true'),
    ).toBe(true);
    expect(pageCheckbox().checked).toBe(true);
    await user.click(pageCheckbox());
    expect(pageCheckbox().checked).toBe(false);
    await user.click(within(rows()[2]).getByRole('checkbox'));
    expect(pageCheckbox().indeterminate).toBe(true);
  });

  it('Select by ▾ Unread, then Mark as read: rows lose "unread" and the status says so', async () => {
    const user = userEvent.setup();
    render(<MailPage />);
    await user.click(screen.getByRole('button', { name: 'Select by' }));
    await user.click(screen.getByRole('menuitem', { name: 'Unread' }));
    const ticked = rows().filter(
      (r) => r.getAttribute('aria-selected') === 'true',
    );
    expect(ticked.length).toBe(9); // every third of the first 25
    await user.click(screen.getByRole('button', { name: 'Mark as read' }));
    expect(screen.getByRole('status').textContent).toBe(
      '9 conversations marked as read.',
    );
    expect(
      rows().some((r) => r.getAttribute('aria-label')?.endsWith('unread')),
    ).toBe(false);
  });

  it('opening a message shows it in the reading pane and marks it read', async () => {
    const user = userEvent.setup();
    render(<MailPage />);
    const first = rows()[0];
    expect(first.getAttribute('aria-label')).toMatch(/unread$/);
    await user.click(within(first).getByText('Ana Ruiz'));
    const pane = screen.getByRole('region', { name: 'Reading pane' });
    expect(within(pane).getByRole('heading', { level: 2 }).textContent).toBe(
      'INV-1100 paid',
    );
    expect(rows()[0].getAttribute('aria-label')).not.toMatch(/unread$/);
  });

  it('search and Unread only filter the list and start a fresh selection', async () => {
    const user = userEvent.setup();
    render(<MailPage />);
    await user.click(pageCheckbox());
    await user.type(
      screen.getByRole('searchbox', { name: 'Search Inbox' }),
      'Initech',
    );
    expect(
      rows().every((r) => r.getAttribute('aria-label')?.startsWith('Initech')),
    ).toBe(true);
    expect(pageCheckbox().checked).toBe(false);
    await user.click(screen.getByRole('switch', { name: 'Unread only' }));
    expect(
      rows().every((r) => r.getAttribute('aria-label')?.endsWith('unread')),
    ).toBe(true);
  });

  it('paging moves to the next 25 and clears the ticks', async () => {
    const user = userEvent.setup();
    render(<MailPage />);
    await user.click(pageCheckbox());
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('26–50 of 60')).toBeTruthy();
    expect(pageCheckbox().checked).toBe(false);
  });

  it('a folder link switches the list (through our RouterProvider)', async () => {
    const user = userEvent.setup();
    render(<MailPage />);
    await user.click(screen.getByRole('link', { name: 'Sent' }));
    const sent = screen.getByRole('grid', { name: 'Sent' });
    expect(within(sent).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Sent');
    await act(async () => undefined);
  });
});
