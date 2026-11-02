import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  MessageList,
  markRead,
  messageName,
  selectBy,
  type MessageItem,
  type MessageListProps,
} from './message-list';

const messages: MessageItem[] = [
  {
    id: 'm1',
    from: 'Ana Ruiz',
    subject: 'INV-1042 paid',
    preview: 'Thanks, payment sent today.',
    date: 'Oct 29',
    dateTime: '2026-10-29',
    unread: true,
  },
  {
    id: 'm2',
    from: 'Northwind',
    subject: 'Question about tax',
    date: 'Oct 28',
  },
  {
    id: 'm3',
    from: 'Sam Lee',
    subject: 'Reminder',
    date: 'Oct 27',
    unread: true,
  },
];

function Inbox(props: Partial<MessageListProps<MessageItem>>) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <>
      <MessageList
        aria-label="Inbox"
        messages={messages}
        selected={selected}
        onSelectionChange={setSelected}
        {...props}
      />
      <output data-testid="selected">{selected.join(',')}</output>
    </>
  );
}
const row = (from: string) =>
  screen.getByRole('row', { name: new RegExp(`^${from}`) });
const selectedIds = () => screen.getByTestId('selected').textContent;
const focusedRow = () =>
  (document.activeElement as HTMLElement).closest('[role=row]');

describe('MessageList', () => {
  it('is a named grid; each row is named sender, subject, date, then "unread"', () => {
    render(<Inbox />);
    expect(screen.getByRole('grid', { name: 'Inbox' })).toBeTruthy();
    expect(
      screen.getByRole('row', {
        name: 'Ana Ruiz, INV-1042 paid, Oct 29, unread',
      }),
    ).toBeTruthy();
    // Read messages don't say "read": no word means the normal state.
    expect(
      screen.getByRole('row', {
        name: 'Northwind, Question about tax, Oct 28',
      }),
    ).toBeTruthy();
  });

  it('the prediction: Space always ticks; Enter opens while nothing is ticked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<Inbox onOpen={onOpen} />);
    await user.tab();
    expect(focusedRow()).toBe(row('Ana Ruiz'));
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenLastCalledWith('m1');
    expect(selectedIds()).toBe('');
    await user.keyboard(' ');
    expect(selectedIds()).toBe('m1');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('once something is ticked it is a "selection mode": Enter waits, clicks tick; Escape clears', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<Inbox onOpen={onOpen} />);
    await user.tab();
    await user.keyboard(' {ArrowDown}{Enter}');
    // Enter neither opens nor ticks while a selection is being made.
    expect(selectedIds()).toBe('m1');
    expect(onOpen).not.toHaveBeenCalled();
    // A click on a row adds it to the selection instead of opening it.
    await user.click(screen.getByText('Reminder'));
    expect(selectedIds()).toBe('m1,m3');
    expect(onOpen).not.toHaveBeenCalled();
    // Escape clears the ticks; Enter opens again.
    await user.keyboard('{Escape}');
    expect(selectedIds()).toBe('');
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('mouse: the checkbox ticks; the row opens while nothing is ticked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<Inbox onOpen={onOpen} />);
    await user.click(screen.getByText('Question about tax'));
    expect(onOpen).toHaveBeenLastCalledWith('m2');
    const checkbox = row('Sam Lee').querySelector(
      '[slot="selection"] input',
    ) as HTMLElement;
    await user.click(checkbox);
    expect(selectedIds()).toBe('m3');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('checking adds to the selection, reported in list order', async () => {
    const user = userEvent.setup();
    render(<Inbox />);
    await user.tab();
    await user.keyboard('{End} {Home} ');
    expect(selectedIds()).toBe('m1,m3');
    expect(row('Sam Lee').getAttribute('aria-selected')).toBe('true');
  });

  it('Ctrl+A checks every message', async () => {
    const user = userEvent.setup();
    render(<Inbox />);
    await user.tab();
    await user.keyboard('{Control>}a{/Control}');
    expect(selectedIds()).toBe('m1,m2,m3');
  });

  it('typing a letter jumps by sender ("unread" is last, so it doesn\'t get in the way)', async () => {
    const user = userEvent.setup();
    render(<Inbox />);
    await user.tab();
    await user.keyboard('s');
    expect(focusedRow()).toBe(row('Sam Lee'));
  });

  it('unread rows: bold sender, a dot, and the date in a <time>', () => {
    render(<Inbox />);
    const ana = row('Ana Ruiz');
    expect(screen.getByText('Ana Ruiz').className).toContain('font-semibold');
    expect(screen.getByText('Northwind').className).not.toContain(
      'font-semibold',
    );
    expect(ana.querySelector('time')?.getAttribute('dateTime')).toBe(
      '2026-10-29',
    );
    expect(ana.querySelector('.bg-primary')).toBeTruthy();
  });

  it('openId highlights the open message', () => {
    render(<Inbox openId="m2" />);
    expect(row('Northwind').className).toContain('before:bg-primary');
    expect(row('Ana Ruiz').className).not.toContain('before:bg-primary');
  });

  it('compact density: one line per message', () => {
    render(<Inbox density="compact" />);
    expect(row('Ana Ruiz').className).toContain('items-center');
  });

  it('shows the empty state when there are no messages', () => {
    render(<Inbox messages={[]} emptyState="Nothing in Archive" />);
    expect(screen.getByText('Nothing in Archive')).toBeTruthy();
  });
});

describe('selectBy / markRead / messageName', () => {
  it('selectBy picks all, none, read or unread ids', () => {
    expect(selectBy(messages, 'all')).toEqual(['m1', 'm2', 'm3']);
    expect(selectBy(messages, 'none')).toEqual([]);
    expect(selectBy(messages, 'unread')).toEqual(['m1', 'm3']);
    expect(selectBy(messages, 'read')).toEqual(['m2']);
  });

  it('markRead returns a copy with only those ids changed', () => {
    const next = markRead(messages, ['m1', 'm2'], false);
    expect(next.map((m) => Boolean(m.unread))).toEqual([true, true, true]);
    const read = markRead(messages, ['m1'], true);
    expect(read[0].unread).toBe(false);
    expect(read[2]).toBe(messages[2]); // untouched rows keep their identity
    expect(messages[0].unread).toBe(true); // the input isn't changed
  });

  it("messageName leaves out what isn't there", () => {
    expect(messageName({ id: 'x', from: 'A', subject: 'B', date: 'C' })).toBe(
      'A, B, C',
    );
  });
});
