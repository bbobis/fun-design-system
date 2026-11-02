import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { must } from '../../utils/must';
import {
  PipelineMap,
  PipelineMapFacilities,
  mapLayout,
  mapPadding,
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

  it('mapPadding widens a side only for a label pointing out of that edge', () => {
    const base = { x: 64, top: 36 };
    const net = (
      placement: 'left' | 'right' | 'above' | 'below',
      id = 'A',
    ): PipelineNetwork => ({
      ...DEMO_NETWORK,
      facilities: DEMO_NETWORK.facilities.map((f) =>
        f.id === id
          ? { ...f, labelPlacement: placement }
          : { ...f, labelPlacement: 'below' },
      ),
    });
    expect(mapPadding(net('below'))).toEqual({
      left: base.x,
      right: base.x,
      top: base.top,
      bottom: 76,
    });
    expect(mapPadding(net('left')).left).toBe(150); // Terminal A is on the left edge
    expect(mapPadding(net('left', 'B')).left).toBe(base.x); // Station B isn't
    expect(mapPadding(net('right', 'D')).right).toBe(150);
    expect(mapPadding(net('above', 'C')).top).toBe(60); // Station C is on the top row
    expect(mapPadding(net('above', 'E')).top).toBe(base.top); // Terminal E isn't
  });

  it('mapLayout uses each side’s padding (closed form still holds)', () => {
    const pad = { left: 150, right: 64, top: 36, bottom: 76 };
    const { unitsPerPx, viewBox } = mapLayout(DEMO_NETWORK, 1000, pad);
    expect(unitsPerPx).toBeCloseTo(12 / (1000 - 150 - 64));
    const [x] = viewBox.split(' ').map(Number);
    expect((0 - (x ?? 0)) / unitsPerPx).toBeCloseTo(150); // left padding is 150px
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

  describe('trace the flow', () => {
    const dimmed = (container: HTMLElement) =>
      [...container.querySelectorAll('[data-dimmed]')]
        .map((el) => el.getAttribute('data-map-item'))
        .sort();

    it('T traces through the focused item: outside the trace is dimmed', async () => {
      const user = userEvent.setup();
      const onTraceChange = vi.fn();
      const { container } = renderMap({ onTraceChange });
      expect(dimmed(container)).toEqual([]);

      await user.tab(); // Terminal A
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}'); // → C
      await user.keyboard('t');

      expect(onTraceChange).toHaveBeenCalledWith('C');
      // B feeds E too, but nothing going to E reaches C: only that branch fades.
      expect(dimmed(container)).toEqual(['B-E', 'E']);
      const c = container.querySelector('[data-map-item="C"]');
      expect(c?.getAttribute('data-trace')).toBe('origin');
    });

    it('says where each item sits, and announces the trace', async () => {
      const user = userEvent.setup();
      renderMap({ defaultTracedId: 'C' });
      expect(
        screen.getByRole('button', {
          name: /^Station B, pump station, upstream$/,
        }),
      ).toBeTruthy();
      expect(
        screen.getByRole('button', {
          name: /^Station C to Refinery F.*, downstream$/,
        }),
      ).toBeTruthy();
      // An item outside the trace keeps its plain name.
      expect(
        screen.getByRole('button', {
          name: /^Terminal E, terminal\. Danger: Emergency shutdown$/,
        }),
      ).toBeTruthy();

      await user.tab(); // the tab stop: the first facility
      await user.keyboard('t'); // trace from A instead
      const live = document.querySelector('[aria-live="polite"]');
      expect(live?.textContent).toBe(
        'Tracing from Terminal A. Upstream: nothing. Downstream: 5 pipes, 5 facilities.',
      );
    });

    it('T again on the traced item stops the trace', async () => {
      const user = userEvent.setup();
      const { container } = renderMap();
      await user.tab(); // Terminal A
      await user.keyboard('t');
      expect(dimmed(container)).toEqual([]); // A feeds everything: nothing to dim
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}'); // A-B → B → B-E
      await user.keyboard('t');
      expect(dimmed(container)).toContain('C');
      await user.keyboard('t');
      expect(dimmed(container)).toEqual([]);
      expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
        'Trace cleared.',
      );
    });

    it('Escape clears the trace first, then the selection', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onTraceChange = vi.fn();
      const { container } = renderMap({
        defaultSelectedId: 'D',
        defaultTracedId: 'E',
        onSelect,
        onTraceChange,
      });
      await user.tab(); // Tank Farm D (the selection): its tooltip opens
      await user.keyboard('{Escape}'); // closes the tooltip
      await user.keyboard('{Escape}'); // clears the trace…
      expect(onTraceChange).toHaveBeenCalledWith(null);
      expect(dimmed(container)).toEqual([]);
      expect(onSelect).not.toHaveBeenCalled(); // …but keeps the selection
      await user.keyboard('{Escape}');
      expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('is controlled by tracedId, and ignores Ctrl+T', async () => {
      const user = userEvent.setup();
      const onTraceChange = vi.fn();
      const { container, rerender } = renderMap({
        tracedId: 'B-E',
        onTraceChange,
      });
      expect(dimmed(container)).toContain('C');
      await user.tab();
      await user.keyboard('{Control>}t{/Control}');
      expect(onTraceChange).not.toHaveBeenCalled();
      rerender(
        <PipelineMap
          network={DEMO_NETWORK}
          products={DEMO_PRODUCTS}
          aria-label="Demo network"
          tracedId={null}
        />,
      );
      expect(dimmed(container)).toEqual([]);
    });

    it('dimmed is an opacity class, and focus brings an item back to full strength', () => {
      const { container } = renderMap({ defaultTracedId: 'C' });
      const e = container.querySelector('[data-map-item="E"]');
      expect(e?.getAttribute('class')).toContain(
        'data-dimmed:not-focus-visible:opacity-25',
      );
    });
  });
});
