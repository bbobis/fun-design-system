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
      screen
        .getByRole('tab', { name: 'Details' })
        .getAttribute('aria-selected'),
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

describe('Tabs styles', () => {
  const tab = (name: string | RegExp) => screen.getByRole('tab', { name });

  it('underline is the default (today’s look)', () => {
    render(<Invoice />);
    expect(screen.getByRole('tablist').className).toContain('border-b');
    expect(tab('Details').className).toContain('border-b-2');
  });

  it('variant on <Tabs> reaches every Tab through context (the prediction)', () => {
    render(<Invoice variant="pills" />);
    for (const t of screen.getAllByRole('tab')) {
      expect(t.className).toContain('rounded-full');
      expect(t.className).toContain('data-selected:bg-primary');
    }
    expect(screen.getByRole('tablist').className).not.toContain('border-b');
  });

  it('enclosed: folder tabs, and the panel becomes the bordered box', () => {
    render(<Invoice variant="enclosed" />);
    expect(tab('Details').className).toContain('rounded-t-md');
    const panel = screen.getByRole('tabpanel');
    expect(panel.className).toContain('border-t-0');
    expect(panel.className).toContain('p-4');
  });

  it('size sm and fullWidth', () => {
    render(<Invoice size="sm" fullWidth />);
    for (const t of screen.getAllByRole('tab')) {
      expect(t.className).toContain('text-xs');
      expect(t.className).toContain('flex-1');
    }
  });

  it('icon is decoration; count is read as "Lines, 12"', () => {
    render(
      <Tabs>
        <TabList aria-label="Invoice sections">
          <Tab id="details" icon={<svg data-testid="icon" />}>
            Details
          </Tab>
          <Tab id="lines" count={12}>
            Lines
          </Tab>
        </TabList>
        <TabPanel id="details">a</TabPanel>
        <TabPanel id="lines">b</TabPanel>
      </Tabs>,
    );
    expect(
      screen.getByTestId('icon').parentElement?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(tab('Details')).toBeTruthy();
    expect(tab('Lines, 12')).toBeTruthy();
  });

  it('keyboard is the same in every variant', () => {
    for (const variant of ['underline', 'pills', 'enclosed'] as const) {
      const { unmount } = render(<Invoice variant={variant} />);
      act(() => tab('Details').focus());
      press('ArrowRight');
      expect(tab('Lines').getAttribute('aria-selected')).toBe('true');
      unmount();
    }
  });
});
