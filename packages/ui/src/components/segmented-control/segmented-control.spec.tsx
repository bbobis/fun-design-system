import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { SegmentedControl, type SegmentedOption } from './segmented-control';

const periods: SegmentedOption[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key });
    fireEvent.keyUp(document.activeElement as Element, { key });
  });
const radio = (name: string) => screen.getByRole('radio', { name });

function Controlled({ onChange }: { onChange?: (id: string) => void }) {
  const [value, setValue] = useState('week');
  return (
    <>
      <button type="button">before</button>
      <SegmentedControl
        aria-label="Period"
        options={periods}
        value={value}
        onChange={(id) => {
          onChange?.(id);
          setValue(id);
        }}
      />
    </>
  );
}

describe('SegmentedControl', () => {
  it('is a radiogroup named by aria-label, with one checked radio per option', () => {
    render(<Controlled />);
    expect(screen.getByRole('radiogroup', { name: 'Period' })).toBeTruthy();
    expect(
      screen.getAllByRole('radio').map((r) => r.getAttribute('aria-checked')),
    ).toEqual(['false', 'true', 'false']);
  });

  it('a click chooses; clicking the chosen one again keeps it (never empty)', () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    fireEvent.click(radio('Month'));
    expect(onChange).toHaveBeenLastCalledWith('month');
    expect(radio('Month').getAttribute('aria-checked')).toBe('true');
    fireEvent.click(radio('Month'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(radio('Month').getAttribute('aria-checked')).toBe('true');
  });

  it('focus entering the group lands on the chosen segment, not the first', () => {
    render(<Controlled />);
    act(() => radio('Day').focus()); // what React Aria would do on Tab
    expect(document.activeElement).toBe(radio('Week'));
  });

  it('arrows only move focus; Space chooses', () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    act(() => radio('Week').focus());
    press('ArrowRight');
    expect(document.activeElement).toBe(radio('Month'));
    expect(onChange).not.toHaveBeenCalled();
    press(' ');
    expect(onChange).toHaveBeenLastCalledWith('month');
  });

  it('uncontrolled: starts on defaultValue, or the first enabled option', () => {
    const { unmount } = render(
      <SegmentedControl
        aria-label="Period"
        options={periods}
        defaultValue="month"
      />,
    );
    expect(radio('Month').getAttribute('aria-checked')).toBe('true');
    unmount();
    render(
      <SegmentedControl
        aria-label="Period"
        options={[{ ...periods[0], disabled: true }, ...periods.slice(1)]}
      />,
    );
    expect(radio('Week').getAttribute('aria-checked')).toBe('true');
    expect(radio('Day').hasAttribute('disabled')).toBe(true);
  });

  it('iconOnly: the label names each segment and no text shows', () => {
    render(
      <SegmentedControl
        aria-label="View"
        iconOnly
        options={[
          { id: 'list', label: 'List', icon: <svg /> },
          { id: 'grid', label: 'Grid', icon: <svg /> },
        ]}
      />,
    );
    expect(radio('List')).toBeTruthy();
    expect(radio('Grid').textContent).toBe('');
  });
});
