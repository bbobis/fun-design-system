import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { PipelineMap } from './pipeline-map';
import { DEMO_PRODUCTS, DEMO_TIMELINE } from './pipeline-map.fixtures';
import { PipelineTimeline } from './pipeline-timeline';

/** Timeline + map, following B-1041, the way an app would wire them. */
function Page({ start = 0 }: { start?: number }) {
  const [index, setIndex] = useState(start);
  const snapshot = DEMO_TIMELINE[index] ?? DEMO_TIMELINE[0];
  return (
    <>
      <PipelineTimeline
        snapshots={DEMO_TIMELINE}
        index={index}
        onIndexChange={setIndex}
        // A fixed format, so the test doesn't depend on the machine's locale.
        formatTime={(iso) => iso.slice(11, 16)}
      />
      <PipelineMap
        network={snapshot?.network ?? { facilities: [], segments: [] }}
        products={DEMO_PRODUCTS}
        aria-label="Demo network"
        defaultFollowedBatch="B-1041"
      />
    </>
  );
}

const thumb = () => screen.getByRole('slider', { name: 'Time' });
const live = () => document.querySelector('[aria-live="polite"]')?.textContent;
const holding = () =>
  [...document.querySelectorAll('[data-segment-id]:not([data-dimmed])')]
    .map((el) => el.getAttribute('data-segment-id'))
    .sort();

describe('PipelineTimeline', () => {
  it('a slider that reads out times, with the range as its description', () => {
    render(<Page />);
    expect(thumb().getAttribute('aria-valuetext')).toBe('06:00');
    const described = thumb().getAttribute('aria-describedby') ?? '';
    const text = described
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
      .join(' ');
    expect(text).toContain('5 snapshots, 06:00 to 10:00');
  });

  it('stepping through time moves the followed batch down the line', async () => {
    const user = userEvent.setup();
    render(<Page />);
    expect(holding()).toEqual(['A-B', 'B-C']); // 06:00: straddles Station B
    act(() => thumb().focus());
    await user.keyboard('{ArrowRight}{ArrowRight}'); // 08:00
    expect(thumb().getAttribute('aria-valuetext')).toBe('08:00');
    expect(holding()).toEqual(['B-C']);
    await user.keyboard('{ArrowRight}'); // 09:00: entering C-D
    expect(holding()).toEqual(['B-C', 'C-D']);
  });

  it('when the batch is delivered: the follow stays, every pipe fades, and it says so', async () => {
    const user = userEvent.setup();
    render(<Page start={3} />);
    act(() => thumb().focus());
    await user.keyboard('{End}'); // 10:00
    expect(holding()).toEqual([]);
    expect(live()).toBe("B-1041 isn't in the pipes at this time.");
    await user.keyboard('{ArrowLeft}'); // back to 09:00
    expect(holding()).toEqual(['B-C', 'C-D']);
    expect(live()).toBe('B-1041 is back in the pipes.');
  });

  it('by default uses the viewer’s locale and the given time zone', () => {
    render(
      <PipelineTimeline
        snapshots={DEMO_TIMELINE}
        index={1}
        onIndexChange={() => undefined}
        timeZone="UTC"
      />,
    );
    // "7:00 AM", "07:00" or "7:00": whatever this machine's locale says, it's 7 o'clock.
    expect(thumb().getAttribute('aria-valuetext')).toMatch(/^0?7:00/);
  });

  it('is disabled with fewer than two snapshots', () => {
    render(
      <PipelineTimeline
        snapshots={DEMO_TIMELINE.slice(0, 1)}
        index={0}
        onIndexChange={() => undefined}
        timeZone="UTC"
      />,
    );
    expect(thumb().hasAttribute('disabled')).toBe(true);
  });
});
