import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { PipelineMap, type PipelineMapHandle } from './pipeline-map';
import { DEMO_NETWORK, DEMO_PRODUCTS } from './pipeline-map.fixtures';
import { PipelineMapSearch, searchOptions } from './pipeline-map-search';

/** Search + map, wired the way an app would. */
function Page({ onPick }: { onPick?: (id: string) => void }) {
  const mapRef = useRef<PipelineMapHandle>(null);
  return (
    <>
      <PipelineMapSearch
        network={DEMO_NETWORK}
        onPick={(id) => {
          onPick?.(id);
          mapRef.current?.focusItem(id);
        }}
      />
      <PipelineMap
        ref={mapRef}
        network={DEMO_NETWORK}
        products={DEMO_PRODUCTS}
        aria-label="Demo network"
      />
    </>
  );
}

describe('searchOptions', () => {
  it('lists facilities, then pipes, with the map id as value', () => {
    const options = searchOptions(DEMO_NETWORK);
    expect(options.map((o) => o.value)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'A-B',
      'B-C',
      'C-D',
      'B-E',
      'C-F',
    ]);
    expect(options[6]).toMatchObject({
      label: 'Terminal A → Station B',
      description: 'pipe · running · 1,100 m³/h',
    });
  });

  it('puts an alert in the facility’s description', () => {
    const e = searchOptions(DEMO_NETWORK).find((o) => o.value === 'E');
    expect(e?.description).toBe('terminal · danger: Emergency shutdown');
  });
});

describe('PipelineMapSearch', () => {
  it('is a named combobox', () => {
    render(<Page />);
    expect(
      screen.getByRole('combobox', { name: 'Find a facility or pipe' }),
    ).toBeTruthy();
  });

  it('type, Enter: focus jumps to that item on the map', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Page onPick={onPick} />);
    await user.type(screen.getByRole('combobox'), 'tank');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onPick).toHaveBeenCalledWith('D');
    const node = screen.getByRole('button', { name: /^Tank Farm D/ });
    expect(document.activeElement).toBe(node);
    // It is now the map's tab stop: Shift+Tab out and Tab back returns to it.
    expect(node.getAttribute('tabindex')).toBe('0');
  });

  it('finds pipes by station name, and the box clears for the next search', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<Page onPick={onPick} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'Refinery');
    // "Refinery F" and the pipe "Station C → Refinery F"
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onPick).toHaveBeenCalledWith('C-F');
    expect(input.value).toBe('');
  });
});

describe('PipelineMapHandle.focusItem', () => {
  it('returns false for an unknown id and leaves focus alone', () => {
    let handle: PipelineMapHandle | null = null;
    render(
      <PipelineMap
        ref={(h) => {
          handle = h;
        }}
        network={DEMO_NETWORK}
        products={DEMO_PRODUCTS}
        aria-label="Demo network"
      />,
    );
    const before = document.activeElement;
    expect((handle as PipelineMapHandle | null)?.focusItem('nope')).toBe(false);
    expect(document.activeElement).toBe(before);
    expect((handle as PipelineMapHandle | null)?.focusItem('B-C')).toBe(true);
  });
});
