import { render, screen } from '@testing-library/react';
import { SegmentedControl } from '../segmented-control';
import { ToggleGroup } from '../toggle-group';
import { TagGroup, type TagItem } from './tag-group';

const has = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => !el?.classList.contains(c))).toEqual([]);
const lacks = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => el?.classList.contains(c))).toEqual([]);
// A tone is a set of CSS variables on the chip; check which tone's variables it got.
const toneOf = (el: Element) =>
  /--color-(\w+)-soft/.exec(el.className)?.[1] ?? 'neutral';

const items: TagItem[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'overdue', label: 'Overdue', tone: 'danger' },
  {
    id: 'ana',
    label: 'Ana Ruiz',
    icon: <svg data-testid="avatar" />,
  },
];

describe('TagGroup styles', () => {
  it('tone per item; neutral by default', () => {
    render(<TagGroup label="Statuses" items={items} />);
    expect(toneOf(screen.getByRole('row', { name: 'Draft' }))).toBe('neutral');
    expect(toneOf(screen.getByRole('row', { name: 'Overdue' }))).toBe('danger');
  });

  it('an icon is decorative: the chip is still named by its label only', () => {
    render(<TagGroup label="Recipients" items={items} />);
    const chip = screen.getByRole('row', { name: 'Ana Ruiz' });
    expect(
      chip.querySelector('[data-tag-icon]')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('shape="pill" rounds the chips; rounded is the default', () => {
    const { unmount } = render(<TagGroup label="A" items={items} />);
    has(screen.getByRole('row', { name: 'Draft' }), 'rounded');
    unmount();
    render(<TagGroup label="B" items={items} shape="pill" />);
    has(screen.getByRole('row', { name: 'Draft' }), 'rounded-full');
  });

  it('a selected toned chip still shows the ✓ (selection is not color alone)', () => {
    render(
      <TagGroup
        label="Show"
        items={items}
        selectionMode="multiple"
        defaultSelectedIds={['overdue']}
      />,
    );
    const chip = screen.getByRole('row', { name: 'Overdue' });
    expect(chip.getAttribute('aria-selected')).toBe('true');
    expect(chip.querySelector('svg')).toBeTruthy();
  });
});

const periods = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
];

describe('SegmentedControl / ToggleGroup styles', () => {
  it('defaults: md, rounded, raised, not full width', () => {
    render(<SegmentedControl aria-label="Period" options={periods} />);
    const day = screen.getByRole('radio', { name: 'Day' });
    has(day, 'h-8', 'rounded', 'data-selected:bg-bg');
    has(screen.getByRole('radiogroup'), 'inline-flex', 'rounded-md');
  });

  it('size="lg", shape="pill", variant="primary"', () => {
    render(
      <SegmentedControl
        aria-label="Period"
        options={periods}
        size="lg"
        shape="pill"
        variant="primary"
      />,
    );
    const day = screen.getByRole('radio', { name: 'Day' });
    has(day, 'h-10', 'rounded-full', 'data-selected:bg-primary');
    // The ring stays with the brand fill: it's what reaches 3:1 against the track.
    has(day, 'data-selected:ring-border-strong');
    lacks(day, 'data-selected:bg-bg');
    has(screen.getByRole('radiogroup'), 'rounded-full');
  });

  it('fullWidth stretches the track and its wrapper', () => {
    render(
      <SegmentedControl aria-label="Period" options={periods} fullWidth />,
    );
    const track = screen.getByRole('radiogroup');
    has(track, 'flex', 'w-full');
    has(track.parentElement, 'w-full');
  });

  it('ToggleGroup takes the same looks', () => {
    render(
      <ToggleGroup
        aria-label="Show"
        options={periods}
        shape="pill"
        variant="primary"
        size="sm"
      />,
    );
    has(
      screen.getByRole('button', { name: 'Day' }),
      'h-7',
      'rounded-full',
      'data-selected:bg-primary',
    );
  });
});
