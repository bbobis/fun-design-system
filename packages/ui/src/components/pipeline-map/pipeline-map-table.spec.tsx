import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PipelineMapTable } from './pipeline-map-table';
import { DEMO_NETWORK } from './pipeline-map.fixtures';

describe('PipelineMapTable', () => {
  it('is two captioned tables: Pipes and Facilities', () => {
    render(<PipelineMapTable network={DEMO_NETWORK} />);
    expect(screen.getByRole('table', { name: 'Pipes' })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Facilities' })).toBeTruthy();
  });

  it('has one row per pipe, named by its route (a row header)', () => {
    render(<PipelineMapTable network={DEMO_NETWORK} />);
    const pipes = screen.getByRole('table', { name: 'Pipes' });
    const routes = within(pipes)
      .getAllByRole('rowheader')
      .map((h) => h.textContent);
    expect(routes).toEqual([
      'Terminal A → Station B',
      'Station B → Station C',
      'Station C → Tank Farm D',
      'Station B → Terminal E',
      'Station C → Refinery F',
    ]);
  });

  it('puts every number on the map into text: flow, batches, tank levels, alerts', () => {
    render(<PipelineMapTable network={DEMO_NETWORK} />);
    const pipes = screen.getByRole('table', { name: 'Pipes' });
    const first = within(pipes).getAllByRole('row')[1];
    expect(first?.textContent).toContain('1,100 of 1,200');
    expect(first?.textContent).toContain('B-1041 · SYN · 52,000 m³');
    const facilities = screen.getByRole('table', { name: 'Facilities' });
    expect(facilities.textContent).toContain('T-3 · 96% · 48,000 of 50,000 m³');
    expect(facilities.textContent).toContain('Danger: Emergency shutdown');
  });

  it('is read-only by default: names are text, not buttons', () => {
    render(<PipelineMapTable network={DEMO_NETWORK} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('with onSelect, names become buttons that select, and the selected row is marked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = render(
      <PipelineMapTable
        network={DEMO_NETWORK}
        onSelect={onSelect}
        selectedId="B-C"
      />,
    );
    const bc = screen.getByRole('button', { name: 'Station B → Station C' });
    expect(bc.getAttribute('aria-pressed')).toBe('true');
    expect(bc.closest('tr')?.hasAttribute('data-selected')).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Tank Farm D' }));
    expect(onSelect).toHaveBeenCalledWith('D');
    rerender(
      <PipelineMapTable
        network={DEMO_NETWORK}
        onSelect={onSelect}
        selectedId="D"
      />,
    );
    expect(
      screen
        .getByRole('button', { name: 'Tank Farm D' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('passes className and attributes to the wrapper', () => {
    const { container } = render(
      <PipelineMapTable
        network={DEMO_NETWORK}
        className="mt-8"
        data-testid="t"
      />,
    );
    const root = container.firstElementChild;
    expect(root?.getAttribute('class')).toContain('mt-8');
    expect(root?.getAttribute('data-testid')).toBe('t');
  });

  describe('follow a batch', () => {
    it('batches are plain text unless onFollowBatch is given', () => {
      render(<PipelineMapTable network={DEMO_NETWORK} />);
      expect(screen.queryByRole('button', { name: /^B-1041/ })).toBeNull();
    });

    it('each part of a batch is a toggle; the followed one is pressed everywhere', async () => {
      const user = userEvent.setup();
      const onFollowBatch = vi.fn();
      const { rerender } = render(
        <PipelineMapTable
          network={DEMO_NETWORK}
          onFollowBatch={onFollowBatch}
        />,
      );
      // B-1041 spans two pipes: one button in each row.
      const parts = screen.getAllByRole('button', { name: /^B-1041/ });
      expect(parts).toHaveLength(2);
      await user.click(parts[0] as HTMLElement);
      expect(onFollowBatch).toHaveBeenCalledWith('B-1041');

      rerender(
        <PipelineMapTable
          network={DEMO_NETWORK}
          followedBatch="B-1041"
          onFollowBatch={onFollowBatch}
        />,
      );
      for (const part of screen.getAllByRole('button', { name: /^B-1041/ }))
        expect(part.getAttribute('aria-pressed')).toBe('true');
      await user.click(
        screen.getAllByRole('button', { name: /^B-1041/ })[1] as HTMLElement,
      );
      expect(onFollowBatch).toHaveBeenLastCalledWith(null); // pressed → stop
    });
  });
});
