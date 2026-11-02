import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { must } from '../../utils/must';
import { formatTime, Timeline, TimelineItem } from './timeline';

const has = (el: Element, ...classes: string[]) =>
  classes.forEach((c) => expect(el.classList.contains(c)).toBe(true));

function History() {
  return (
    <Timeline aria-label="INV-1044 history">
      <TimelineItem
        tone="success"
        title="Payment received"
        time="2026-10-14T09:32:00Z"
        timeLabel="Oct 14"
      >
        $4,200 by card
      </TimelineItem>
      <TimelineItem
        actor="Dana Smith"
        title="sent the invoice"
        time="2026-10-02"
      />
      <TimelineItem title="Payment due" time="2026-11-15" upcoming />
    </Timeline>
  );
}

describe('Timeline', () => {
  it('is a named ordered list, one item per event', () => {
    render(<History />);
    const list = screen.getByRole('list', { name: 'INV-1044 history' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('times are <time> elements with the ISO value in dateTime', () => {
    render(<History />);
    const time = screen.getByText('Oct 14');
    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('datetime')).toBe('2026-10-14T09:32:00Z');
  });

  it('reads actor, title and details in order; markers are hidden', () => {
    render(<History />);
    const [paid, sent] = screen.getAllByRole('listitem');
    expect(must(sent).textContent).toContain('Dana Smith sent the invoice');
    expect(must(paid).textContent).toContain('$4,200 by card');
    // The marker column is decoration.
    expect(must(paid).firstElementChild?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('upcoming says so in words, not only with a dashed style', () => {
    render(<History />);
    const due = must(screen.getAllByRole('listitem')[2]);
    expect(due.textContent).toContain('Payment due, upcoming');
  });

  it('a custom marker replaces the dot', () => {
    render(
      <Timeline>
        <TimelineItem title="Commented" marker={<svg data-testid="icon" />} />
      </Timeline>,
    );
    expect(screen.getByTestId('icon')).toBeTruthy();
  });

  it('size comes from the list', () => {
    render(
      <Timeline size="sm">
        <TimelineItem title="Sent" />
      </Timeline>,
    );
    const item = screen.getByRole('listitem');
    const marker = must(item.firstElementChild?.firstElementChild);
    has(marker, 'size-5');
    has(must(item.lastElementChild), 'text-xs', 'pb-4');
  });

  it('passes className, attributes and ref through', () => {
    const ref = createRef<HTMLOListElement>();
    render(
      <Timeline ref={ref} className="mt-8" data-testid="tl">
        <TimelineItem title="A" className="custom" />
      </Timeline>,
    );
    expect(ref.current).toBe(screen.getByTestId('tl'));
    has(screen.getByTestId('tl'), 'mt-8');
    has(screen.getByRole('listitem'), 'custom');
  });
});

describe('formatTime', () => {
  const original = process.env.TZ;
  afterEach(() => {
    process.env.TZ = original;
  });

  it('a date with no time stays the same day in a time zone behind UTC', () => {
    // Toronto: midnight UTC on the 14th is still the evening of the 13th there.
    process.env.TZ = 'America/Toronto';
    expect(formatTime('2026-10-14', 'en-US')).toBe('Oct 14, 2026');
  });

  it('a date and time is shown in the user’s time zone', () => {
    process.env.TZ = 'America/Toronto';
    // 09:32 UTC = 05:32 in Toronto (EDT, UTC−4 in October).
    expect(formatTime('2026-10-14T09:32:00Z', 'en-US')).toBe(
      'Oct 14, 2026, 5:32 AM',
    );
  });

  it('shows unreadable text as is instead of "Invalid Date"', () => {
    expect(formatTime('soon')).toBe('soon');
  });
});
