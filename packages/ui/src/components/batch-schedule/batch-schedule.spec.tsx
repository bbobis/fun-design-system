import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { must } from '../../utils/must';
import { BatchSchedule, type BatchScheduleProps } from './batch-schedule';
import {
  DEMO_BATCHES,
  DEMO_LINES,
  DEMO_SCHEDULE_PRODUCTS,
} from './batch-schedule.fixtures';
import {
  assignLanes,
  barPosition,
  dayBoundaries,
  moveFocus,
  type ScheduledBatch,
} from './schedule-model';

const HOUR = 3_600_000;

describe('schedule model', () => {
  it('the prediction: Sun Nov 1, 2026 is 25 hours long in Edmonton (clocks go back)', () => {
    const b = dayBoundaries('2026-11-01', 2, 'America/Edmonton');
    expect((must(b[1]) - must(b[0])) / HOUR).toBe(25);
    expect((must(b[2]) - must(b[1])) / HOUR).toBe(24);
    // The first boundary is local midnight: 06:00 UTC (still MDT, UTC−6).
    expect(new Date(must(b[0])).toISOString()).toBe('2026-11-01T06:00:00.000Z');
  });

  it('barPosition: % of the window, cut flags at the edges, null outside', () => {
    expect(barPosition(25, 75, 0, 100)).toEqual({
      left: 25,
      width: 50,
      cutStart: false,
      cutEnd: false,
    });
    expect(barPosition(-50, 50, 0, 100)).toMatchObject({
      left: 0,
      width: 50,
      cutStart: true,
    });
    expect(barPosition(100, 120, 0, 100)).toBeNull();
  });

  const batch = (id: string, start: number, end: number): ScheduledBatch => ({
    id,
    name: id,
    product: 'SYN',
    line: 'x',
    start: new Date(start * HOUR).toISOString(),
    end: new Date(end * HOUR).toISOString(),
  });

  it('assignLanes: back-to-back batches share a lane, overlaps get a new one', () => {
    const { lanes, count } = assignLanes([
      batch('a', 0, 10),
      batch('b', 10, 20), // starts as a ends: same lane
      batch('c', 5, 12), // overlaps a and b
    ]);
    expect(lanes.get('a')).toBe(0);
    expect(lanes.get('b')).toBe(0);
    expect(lanes.get('c')).toBe(1);
    expect(count).toBe(2);
  });

  it('moveFocus: along a line, and to the closest-in-time batch on the next line', () => {
    const rows = [
      [batch('a1', 0, 10), batch('a2', 10, 20), batch('a3', 20, 30)],
      [], // an empty line is skipped
      [batch('c1', 0, 4), batch('c2', 4, 18), batch('c3', 18, 40)],
    ];
    expect(moveFocus(rows, 'a2', 'next')).toBe('a3');
    expect(moveFocus(rows, 'a3', 'next')).toBe('a3'); // stops at the end
    expect(moveFocus(rows, 'a2', 'down')).toBe('c2'); // midpoint 15 ~ 11
    expect(moveFocus(rows, 'c3', 'up')).toBe('a3');
    expect(moveFocus(rows, 'a1', 'last')).toBe('a3');
  });
});

function Schedule(props: Partial<BatchScheduleProps>) {
  return (
    <BatchSchedule
      aria-label="Injection schedule"
      lines={DEMO_LINES}
      batches={DEMO_BATCHES}
      products={DEMO_SCHEDULE_PRODUCTS}
      from="2026-11-02"
      days={7}
      timeZone="America/Edmonton"
      locale="en-US"
      now="2026-11-03T18:00:00Z"
      {...props}
    />
  );
}

const bar = (name: string) =>
  screen.getByRole('button', { name: new RegExp(`^${name},`) });

describe('BatchSchedule', () => {
  it('is a named region; each line is a group named by its label', () => {
    render(<Schedule />);
    const region = screen.getByRole('region', { name: 'Injection schedule' });
    const line = within(region).getByRole('group', { name: 'Line 1 · A → B' });
    expect(within(line).getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('each bar says name, product, line, times, volume and status in words', () => {
    render(<Schedule />);
    expect(bar('26-114').getAttribute('aria-label')).toBe(
      '26-114, SWT, Line 1 · A → B, Nov 4, 12:00 AM to Nov 5, 12:00 PM, 28,500 m³, at risk',
    );
  });

  it('one Tab stop: the first batch that is not complete', async () => {
    const user = userEvent.setup();
    render(<Schedule />);
    await user.tab();
    expect(document.activeElement).toBe(bar('26-112'));
    const tabbable = screen
      .getAllByRole('button')
      .filter((b) => b.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
  });

  it('arrow keys move along a line and between lines; Enter opens the batch', async () => {
    const user = userEvent.setup();
    const onBatchAction = vi.fn();
    render(<Schedule onBatchAction={onBatchAction} />);
    act(() => bar('26-112').focus());
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(bar('26-114'));
    await user.keyboard('{ArrowDown}');
    // Closest in time to 26-114 on Line 1 · B → C.
    expect(document.activeElement).toBe(bar('26-113T'));
    await user.keyboard('{Enter}');
    expect(onBatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'b113t' }),
    );
    // The roving tab stop followed.
    expect(bar('26-113T').tabIndex).toBe(0);
    expect(bar('26-112').tabIndex).toBe(-1);
  });

  it('a batch that started before the window is drawn cut (no rounded start)', () => {
    render(<Schedule />);
    const cut = bar('26-110');
    expect(cut.classList.contains('rounded-s')).toBe(false);
    expect(bar('26-112').classList.contains('rounded-s')).toBe(true);
  });

  it('batches entirely outside the days are not drawn', () => {
    render(<Schedule from="2026-11-20" days={2} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByText('No batches in these days')).toHaveLength(3);
  });

  it('an unlisted product is "other" (neutral), and products 4–6 are striped', () => {
    render(<Schedule />);
    expect(bar('26-205').className).toContain('border-s-line-neutral');
    expect(bar('26-116').className).toContain('repeating-linear-gradient'); // CON is 4th
  });
});
