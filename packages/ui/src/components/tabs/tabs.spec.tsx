import { act, fireEvent, render, screen } from '@testing-library/react';
import { Tab, TabList, TabPanel, Tabs, type TabsProps } from './tabs';

function Invoice(props: Partial<TabsProps>) {
  return (
    <Tabs {...props}>
      <TabList aria-label="Invoice sections">
        <Tab id="details">Details</Tab>
        <Tab id="lines">Lines</Tab>
        <Tab id="audit" disabled>
          Audit
        </Tab>
        <Tab id="history">History</Tab>
      </TabList>
      <TabPanel id="details">Customer and dates</TabPanel>
      <TabPanel id="lines">12 lines</TabPanel>
      <TabPanel id="audit">Audit log</TabPanel>
      <TabPanel id="history">3 changes</TabPanel>
    </Tabs>
  );
}

const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key });
    fireEvent.keyUp(document.activeElement ?? document.body, { key });
  });

describe('Tabs', () => {
  it('tablist named by aria-label; the panel is labelled by its tab', () => {
    render(<Invoice />);
    expect(
      screen.getByRole('tablist', { name: 'Invoice sections' }),
    ).toBeTruthy();
    const details = screen.getByRole('tab', { name: 'Details' });
    expect(details.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: 'Details' }).textContent).toBe(
      'Customer and dates',
    );
  });

  it('automatic: → moves and shows the next panel; disabled tabs are skipped', () => {
    const onChange = vi.fn();
    render(<Invoice onChange={onChange} />);
    act(() => screen.getByRole('tab', { name: 'Details' }).focus());
    press('ArrowRight');
    expect(onChange).toHaveBeenLastCalledWith('lines');
    expect(screen.getByRole('tabpanel').textContent).toBe('12 lines');
    press('ArrowRight'); // skips Audit (disabled)
    expect(onChange).toHaveBeenLastCalledWith('history');
  });

  it('does not call onChange on mount (React Aria auto-picks the first tab)', () => {
    const onChange = vi.fn();
    render(<Invoice onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole('tab', { name: 'Details' }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('manual: → only moves focus; Enter shows the panel', () => {
    const onChange = vi.fn();
    render(<Invoice keyboardActivation="manual" onChange={onChange} />);
    act(() => screen.getByRole('tab', { name: 'Details' }).focus());
    press('ArrowRight');
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByRole('tab', { name: 'Lines' }),
    );
    press('Enter');
    expect(onChange).toHaveBeenLastCalledWith('lines');
  });

  it('the tab list is one Tab stop', () => {
    render(<Invoice />);
    const stops = screen.getAllByRole('tab').filter((t) => t.tabIndex === 0);
    expect(stops).toHaveLength(1);
  });

  it('controlled: follows `value`', () => {
    const { rerender } = render(<Invoice value="details" />);
    rerender(<Invoice value="history" />);
    expect(screen.getByRole('tabpanel').textContent).toBe('3 changes');
  });
});
