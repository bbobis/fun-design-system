import { act, fireEvent, render, screen } from '@testing-library/react';
import { EquipmentStatus } from './equipment-status';
import {
  durationOf,
  stateLabel,
  type EquipmentState,
} from './equipment-status-model';

const NOW = Date.parse('2026-11-03T10:30:00Z');
const ALL = Object.keys(stateLabel) as EquipmentState[];

describe('durationOf', () => {
  it('floors to the biggest whole unit, short for the eye and long for the ear', () => {
    expect(durationOf('2026-11-03T10:29:45Z', NOW)).toEqual({
      short: '<1 min',
      long: 'less than a minute',
    });
    expect(durationOf('2026-11-03T10:29:00Z', NOW).long).toBe('1 minute');
    expect(durationOf('2026-11-03T09:31:00Z', NOW).short).toBe('59 min');
    expect(durationOf('2026-11-03T07:10:00Z', NOW)).toEqual({
      short: '3 h',
      long: '3 hours',
    });
    expect(durationOf('2026-11-01T10:00:00Z', NOW).short).toBe('2 d');
  });

  it('never goes negative when the clock is a little behind', () => {
    expect(durationOf('2026-11-03T10:31:00Z', NOW).short).toBe('<1 min');
  });
});

describe('EquipmentStatus', () => {
  it('says the state in words for every state, not only with a shape or color', () => {
    for (const status of ALL) {
      const { container, unmount } = render(
        <EquipmentStatus status={status} />,
      );
      expect(container.textContent).toBe(stateLabel[status]);
      unmount();
    }
  });

  it('draws a different shape for every state (the ISA-101 rule)', () => {
    const shapes = ALL.map((status) => {
      const { container, unmount } = render(
        <EquipmentStatus status={status} />,
      );
      const svg = container.querySelector('svg')?.innerHTML;
      unmount();
      return svg;
    });
    expect(new Set(shapes).size).toBe(ALL.length);
  });

  it('keeps the glyph out of the accessibility tree: the word already says it', () => {
    const { container } = render(<EquipmentStatus status="running" />);
    expect(
      container.querySelector('svg')?.closest('[aria-hidden="true"]'),
    ).toBeTruthy();
  });

  it('colors only the abnormal states; normal ones stay gray', () => {
    const cls = (status: EquipmentState) => {
      const { container, unmount } = render(
        <EquipmentStatus status={status} />,
      );
      const c = (container.firstElementChild as HTMLElement).className;
      unmount();
      return c;
    };
    expect(cls('running')).toContain('bg-surface');
    expect(cls('stopped')).toContain('bg-surface');
    expect(cls('maintenance')).toContain('bg-surface');
    expect(cls('comms-lost')).toContain('bg-warning-soft');
    expect(cls('fault')).toContain('bg-danger');
  });

  it('shows the time in state short, and says it long', () => {
    const { container } = render(
      <EquipmentStatus status="fault" since="2026-11-03T10:18:00Z" now={NOW} />,
    );
    expect(screen.getByText('· 12 min').getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(screen.getByText(', for 12 minutes').className).toContain('sr-only');
    // What a screen reader gets, in order: the text minus the aria-hidden parts.
    const copy = container.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
    expect(copy.textContent).toBe('Fault, for 12 minutes');
  });

  it('label replaces the word but keeps the glyph', () => {
    const { container } = render(
      <EquipmentStatus status="fault" label="Tripped" />,
    );
    expect(container.textContent).toBe('Tripped');
    expect(container.querySelector('[data-status="fault"] svg')).toBeTruthy();
  });

  it('inline: no pill, and the glyph carries the (only abnormal) color', () => {
    const { container } = render(
      <EquipmentStatus variant="inline" status="fault" />,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).not.toContain('rounded-full');
    expect(box.querySelector('[aria-hidden]')?.className).toContain(
      'text-fg-danger',
    );
  });

  it('icon: a named image, not a span with a title (the prediction)', () => {
    render(
      <EquipmentStatus
        variant="icon"
        name="Pump 2"
        status="comms-lost"
        since="2026-11-03T10:18:00Z"
        now={NOW}
      />,
    );
    const img = screen.getByRole('img', {
      name: 'Pump 2: Comms lost, for 12 minutes',
    });
    expect(img.getAttribute('title')).toBeNull();
    expect(img.tabIndex).toBe(0);
  });

  it('icon: shows the tooltip on keyboard focus, without adding a second description', async () => {
    render(<EquipmentStatus variant="icon" name="Pump 2" status="fault" />);
    const img = screen.getByRole('img', { name: 'Pump 2: Fault' });
    // React Aria only shows tooltips for keyboard focus: press a key first.
    fireEvent.keyDown(document.body, { key: 'Tab' });
    fireEvent.keyUp(document.body, { key: 'Tab' });
    act(() => img.focus());
    const tip = await screen.findByRole('tooltip');
    expect(tip.textContent).toBe('Pump 2 · Fault');
    // kind="label": the hint repeats the name, so its text is hidden from screen readers.
    expect(tip.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('icon with tooltip={false}: not a tab stop (the row around it is)', () => {
    render(
      <EquipmentStatus
        variant="icon"
        name="Pump 2"
        status="running"
        tooltip={false}
      />,
    );
    expect(
      screen
        .getByRole('img', { name: 'Pump 2: Running' })
        .hasAttribute('tabindex'),
    ).toBe(false);
  });

  it('name on a badge is said, not shown', () => {
    render(<EquipmentStatus status="stopped" name="Pump 3" />);
    expect(screen.getByText('Pump 3:').className).toContain('sr-only');
  });
});
