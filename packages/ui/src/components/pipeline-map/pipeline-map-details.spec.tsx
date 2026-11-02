import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { PipelineMap } from './pipeline-map';
import { DEMO_NETWORK, DEMO_PRODUCTS } from './pipeline-map.fixtures';
import { PipelineMapDetails, connectedPipes } from './pipeline-map-details';

const details = () => screen.getByRole('complementary', { name: 'Details' });

describe('connectedPipes', () => {
  it('splits a facility’s pipes into in and out', () => {
    const { incoming, outgoing } = connectedPipes(DEMO_NETWORK, 'B');
    expect(incoming.map((s) => s.id)).toEqual(['A-B']);
    expect(outgoing.map((s) => s.id)).toEqual(['B-C', 'B-E']);
  });
});

describe('PipelineMapDetails', () => {
  it('is a named complementary landmark with a hint when nothing is selected', () => {
    render(<PipelineMapDetails network={DEMO_NETWORK} selectedId={null} />);
    expect(details().textContent).toContain('Select a facility or pipe');
  });

  it('a facility: heading, kind, alert, tanks (with "high" in words), pipes', () => {
    render(<PipelineMapDetails network={DEMO_NETWORK} selectedId="D" />);
    const panel = details();
    expect(
      within(panel).getByRole('heading', { level: 2, name: 'Tank Farm D' }),
    ).toBeTruthy();
    expect(panel.textContent).toContain('Warning: Tank T-3 above 95%');
    const tanks = within(panel).getByRole('list', { name: 'Tanks' });
    expect(tanks.textContent).toContain(
      'T-3 · 96% · 48,000 of 50,000 m³ · high',
    );
    expect(
      within(panel).getByRole('list', { name: 'Pipes out' }).textContent,
    ).toContain('None (end of the line)');
  });

  it('a pipe: route, flow with %, line fill, batches', () => {
    render(<PipelineMapDetails network={DEMO_NETWORK} selectedId="B-C" />);
    const panel = details();
    expect(
      within(panel).getByRole('heading', { name: 'Station B → Station C' }),
    ).toBeTruthy();
    expect(panel.textContent).toContain('700 of 1,200 m³/h (58%)');
    expect(panel.textContent).toContain('72,000 m³');
    expect(
      within(panel).getByRole('list', { name: 'Batches, downstream first' })
        .textContent,
    ).toContain('B-1041 · SYN · 44,000 m³');
  });

  it('headingLevel fits the page outline', () => {
    render(
      <PipelineMapDetails
        network={DEMO_NETWORK}
        selectedId="A"
        headingLevel={3}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Terminal A' }),
    ).toBeTruthy();
  });

  it('Trace flow is a toggle, and pressing it keeps focus on the button', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [traced, setTraced] = useState<string | null>(null);
      return (
        <PipelineMapDetails
          network={DEMO_NETWORK}
          selectedId="C"
          tracedId={traced}
          onTraceChange={setTraced}
        />
      );
    }
    render(<Harness />);
    const trace = screen.getByRole('button', { name: /Trace flow/ });
    expect(trace.getAttribute('aria-pressed')).toBe('false');
    await user.click(trace);
    expect(trace.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(trace); // the prediction: focus stays put
    await user.click(trace);
    expect(trace.getAttribute('aria-pressed')).toBe('false');
  });

  it('connected items select, batches follow, Show on map reports the id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onFollowBatch = vi.fn();
    const onShowOnMap = vi.fn();
    render(
      <PipelineMapDetails
        network={DEMO_NETWORK}
        selectedId="A-B"
        onSelect={onSelect}
        onFollowBatch={onFollowBatch}
        followedBatch="B-1041"
        onShowOnMap={onShowOnMap}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Station B' }));
    expect(onSelect).toHaveBeenCalledWith('B');
    const batch = screen.getByRole('button', { name: /^B-1041/ });
    expect(batch.getAttribute('aria-pressed')).toBe('true');
    await user.click(batch);
    expect(onFollowBatch).toHaveBeenCalledWith(null);
    await user.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(onShowOnMap).toHaveBeenCalledWith('A-B');
  });
});

describe('with selectionFollowsFocus', () => {
  it('arrow keys change the selection, so the panel follows as you move', async () => {
    const user = userEvent.setup();
    function Page() {
      const [id, setId] = useState<string | null>(null);
      return (
        <>
          <PipelineMap
            network={DEMO_NETWORK}
            products={DEMO_PRODUCTS}
            aria-label="Demo network"
            selectionFollowsFocus
            selectedId={id}
            onSelect={setId}
          />
          <PipelineMapDetails network={DEMO_NETWORK} selectedId={id} />
        </>
      );
    }
    render(<Page />);
    await user.tab(); // Terminal A
    expect(within(details()).getByRole('heading').textContent).toBe(
      'Terminal A',
    );
    await user.keyboard('{ArrowRight}{ArrowRight}'); // A-B → Station B
    expect(within(details()).getByRole('heading').textContent).toBe(
      'Station B',
    );
  });

  it('is off by default: focus alone does not select', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <PipelineMap
        network={DEMO_NETWORK}
        products={DEMO_PRODUCTS}
        aria-label="Demo network"
        onSelect={onSelect}
      />,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
