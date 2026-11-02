import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { must } from '../../utils/must';
import {
  PipelineMap,
  PipelineMapFacilities,
  mapLayout,
  networkBounds,
  segmentLabel,
} from './pipeline-map';
import { DEMO_NETWORK, DEMO_PRODUCTS } from './pipeline-map.fixtures';
import type { PipelineNetwork } from './pipeline-model';

const renderMap = (
  props: Partial<React.ComponentProps<typeof PipelineMap>> = {},
) =>
  render(
    <PipelineMap
      network={DEMO_NETWORK}
      products={DEMO_PRODUCTS}
      aria-label="Demo network"
      {...props}
    />,
  );

describe('layout helpers', () => {
  it('networkBounds covers facilities and waypoints', () => {
    expect(networkBounds(DEMO_NETWORK)).toEqual({
      minX: 0,
      minY: 1,
      maxX: 12,
      maxY: 4,
    });
  });

  it('mapLayout keeps px padding in px: wider map → fewer units per px', () => {
    const narrow = mapLayout(DEMO_NETWORK, 360);
    const wide = mapLayout(DEMO_NETWORK, 1080);
    // span 12 units over (width − 2 × 64px) of drawing room
    expect(narrow.unitsPerPx).toBeCloseTo(12 / (360 - 128));
    expect(wide.unitsPerPx).toBeCloseTo(12 / (1080 - 128));
    expect(wide.unitsPerPx).toBeLessThan(narrow.unitsPerPx);
    // The padding converts back to exactly 64px at either width.
    const [x, , w] = wide.viewBox.split(' ').map(Number);
    expect(((0 - (x ?? 0)) / (w ?? 1)) * 1080).toBeCloseTo(64);
  });

  it('segmentLabel says route, status, flow and batch count', () => {
    const byId = new Map(DEMO_NETWORK.facilities.map((f) => [f.id, f]));
    const seg = DEMO_NETWORK.segments[0];
    if (!seg) throw new Error('fixture');
    expect(segmentLabel(seg, byId)).toBe(
      'Terminal A to Station B, running, 1,100 m³/h, 2 batches',
    );
  });
});

describe('PipelineMap', () => {
  it('is a named group of pipes and facilities', () => {
    renderMap();
    const map = screen.getByRole('group', { name: 'Demo network' });
    const buttons = within(map).getAllByRole('button');
    expect(buttons).toHaveLength(
      DEMO_NETWORK.segments.length + DEMO_NETWORK.facilities.length,
    );
    expect(
      within(map).getByRole('button', {
        name: 'Station B to Station C, restricted, 700 m³/h, 2 batches',
      }),
    ).toBeTruthy();
    expect(
      within(map).getByRole('button', {
        name: /^Tank Farm D, tank farm\. Warning/,
      }),
    ).toBeTruthy();
  });

  it('paints facilities after pipes, so markers sit on top', () => {
    const { container } = renderMap();
    const layers = [...container.querySelectorAll('[data-layer]')].map((l) =>
      l.getAttribute('data-layer'),
    );
    expect(layers).toEqual(['segments', 'facilities']);
  });

  it('selects on click (uncontrolled) and marks it pressed', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMap({ onSelect });
    const station = screen.getByRole('button', {
      name: /^Station B, pump station/,
    });
    await user.click(station);
    expect(onSelect).toHaveBeenCalledWith('B');
    expect(station.getAttribute('aria-pressed')).toBe('true');
  });

  it('selects a pipe with Enter, and Escape clears the selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMap({ onSelect });
    const pipe = screen.getByRole('button', {
      name: /^Terminal A to Station B/,
    });
    pipe.focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith('A-B');
    expect(pipe.getAttribute('aria-pressed')).toBe('true');
    await user.keyboard('{Escape}');
    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(pipe.getAttribute('aria-pressed')).toBe('false');
  });

  it('pipe focus is a hollow ring, selection a filled halo, so they never look alike', () => {
    const { container } = renderMap({ defaultSelectedId: 'A-B' });
    const pipe = container.querySelector('[data-segment-id="A-B"]');
    const ring = pipe?.querySelector('[data-focus-ring]');
    const [outer, inner] = [...(ring?.querySelectorAll('path') ?? [])];
    expect(outer?.getAttribute('class')).toContain('stroke-focus-ring');
    expect(inner?.getAttribute('class')).toContain('stroke-bg'); // the gap that makes it hollow
    expect(
      pipe?.querySelector('[data-selection-halo]')?.getAttribute('class'),
    ).toContain('stroke-primary');
  });

  it('when controlled, shows only what the parent says is selected', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [id, setId] = useState<string | null>('C');
      return (
        <>
          <PipelineMap
            network={DEMO_NETWORK}
            products={DEMO_PRODUCTS}
            aria-label="Demo network"
            selectedId={id}
            onSelect={(next) => setId(next === 'E' ? id : next)} // parent refuses E
          />
          <output>{id ?? 'none'}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole('status').textContent).toBe('C');
    await user.click(screen.getByRole('button', { name: /^Terminal E/ }));
    expect(screen.getByRole('status').textContent).toBe('C');
    await user.click(screen.getByRole('button', { name: /^Refinery F/ }));
    expect(screen.getByRole('status').textContent).toBe('F');
  });

  it('skips a segment whose facility is missing instead of drawing to (0, 0)', () => {
    const broken: PipelineNetwork = {
      ...DEMO_NETWORK,
      segments: [
        ...DEMO_NETWORK.segments,
        { ...must(DEMO_NETWORK.segments[0]), id: 'X', to: 'nowhere' },
      ],
    };
    const { container } = renderMap({ network: broken });
    expect(container.querySelector('[data-segment-id="X"]')).toBeNull();
  });

  it('uses its measured width to size things in px', () => {
    const spy = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({ width: 1080 } as DOMRect);
    const { container } = renderMap();
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe(
      mapLayout(DEMO_NETWORK, 1080).viewBox,
    );
    spy.mockRestore();
  });

  it('lets you pick and order layers, and passes attributes to the svg', () => {
    const { container } = render(
      <PipelineMap
        network={DEMO_NETWORK}
        products={DEMO_PRODUCTS}
        aria-label="Facilities only"
        className="max-w-xl"
        data-testid="map"
      >
        <PipelineMapFacilities />
      </PipelineMap>,
    );
    expect(container.querySelector('[data-layer="segments"]')).toBeNull();
    const svg = screen.getByTestId('map');
    expect(svg.getAttribute('class')).toContain('max-w-xl');
  });

  it('throws a clear error when a layer is used outside the map', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<PipelineMapFacilities />)).toThrow(
      '<PipelineMapFacilities> must be inside <PipelineMap>.',
    );
    spy.mockRestore();
  });

  describe('keyboard (roving tabindex)', () => {
    const renderWithButtons = (props = {}) =>
      render(
        <>
          <button type="button">Before</button>
          <PipelineMap
            network={DEMO_NETWORK}
            products={DEMO_PRODUCTS}
            aria-label="Demo network"
            {...props}
          />
          <button type="button">After</button>
        </>,
      );
    const item = (name: RegExp) => screen.getByRole('button', { name });

    it('is one Tab stop: in at the first facility, the next Tab leaves the map', async () => {
      const user = userEvent.setup();
      renderWithButtons();
      const inTabOrder = screen
        .getAllByRole('button')
        .filter((b) => b.getAttribute('tabindex') === '0' && b.closest('svg'));
      expect(inTabOrder).toHaveLength(1);
      await user.tab(); // Before
      await user.tab();
      expect(document.activeElement).toBe(item(/^Terminal A, terminal/));
      await user.tab();
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'After' }),
      );
    });

    it('arrows walk the network: facility → pipe → facility', async () => {
      const user = userEvent.setup();
      renderWithButtons();
      await user.tab();
      await user.tab(); // Terminal A
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(item(/^Terminal A to Station B/));
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(item(/^Station B, pump station/));
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(item(/^Station B to Terminal E/));
      await user.keyboard('{ArrowLeft}'); // nothing that way: stays
      expect(document.activeElement).toBe(item(/^Station B to Terminal E/));
    });

    it('Home and End jump to the first and last facility', async () => {
      const user = userEvent.setup();
      renderWithButtons();
      await user.tab();
      await user.tab();
      await user.keyboard('{End}');
      expect(document.activeElement).toBe(item(/^Refinery F/));
      await user.keyboard('{Home}');
      expect(document.activeElement).toBe(item(/^Terminal A, terminal/));
    });

    it('Tab comes back to where you left off', async () => {
      const user = userEvent.setup();
      renderWithButtons();
      await user.tab();
      await user.tab();
      await user.keyboard('{ArrowRight}{ArrowRight}'); // Station B
      await user.tab(); // out to After
      await user.tab({ shift: true }); // back in
      expect(document.activeElement).toBe(item(/^Station B, pump station/));
    });

    it('starts at the selected item when there is one', () => {
      renderWithButtons({ defaultSelectedId: 'C' });
      expect(item(/^Station C, pump station/).getAttribute('tabindex')).toBe(
        '0',
      );
      expect(item(/^Terminal A, terminal/).getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('tooltips', () => {
    it('focusing a pipe shows its batches, and they describe it for screen readers', async () => {
      const user = userEvent.setup();
      renderMap();
      await user.tab(); // Terminal A
      await user.keyboard('{ArrowRight}'); // A-B
      const tip = await screen.findByRole('tooltip');
      expect(tip.textContent).toContain('B-1041 · SYN · 52,000 m³');
      const pipe = screen.getByRole('button', {
        name: /^Terminal A to Station B/,
      });
      expect(pipe.getAttribute('aria-describedby')).toBe(tip.id);
    });

    it('Escape does one thing at a time: closes the tooltip, then clears the selection', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      renderMap({ defaultSelectedId: 'D', onSelect });
      await user.tab(); // Tank Farm D: selected, and its tooltip opens on keyboard focus
      await screen.findByRole('tooltip');
      const node = screen.getByRole('button', { name: /^Tank Farm D/ });

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('tooltip')).toBeNull(); // 1st Escape: tooltip closes…
      expect(node.getAttribute('aria-pressed')).toBe('true'); // …selection stays
      expect(onSelect).not.toHaveBeenCalled();

      await user.keyboard('{Escape}');
      expect(node.getAttribute('aria-pressed')).toBe('false'); // 2nd Escape: clears
      expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('a facility tooltip lists each tank level', async () => {
      const user = userEvent.setup();
      renderMap({ defaultSelectedId: 'D' });
      await user.tab(); // Tank Farm D (selected = tab stop)
      const tip = await screen.findByRole('tooltip');
      expect(tip.textContent).toContain('T-3 · 96% · 48,000 of 50,000 m³');
      expect(tip.textContent).toContain('Tank T-3 above 95%');
    });
  });
});
