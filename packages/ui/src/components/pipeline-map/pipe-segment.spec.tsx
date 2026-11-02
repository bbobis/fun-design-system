import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { PipeSegment, type PipeSegmentProps } from './pipe-segment';

const renderPipe = (props: Partial<PipeSegmentProps> = {}) =>
  render(
    <svg>
      <PipeSegment
        d="M 0 0 L 4 0"
        status="running"
        flowRate={600}
        maxFlowRate={1200}
        {...props}
      />
    </svg>,
  );
const path = (container: HTMLElement) => {
  const el = container.querySelector('path');
  if (!el) throw new Error('no <path> rendered');
  return el;
};

describe('PipeSegment', () => {
  it('is named for screen readers when it has a label', () => {
    renderPipe({ label: 'Terminal A to Station B, running, 600 m³/h' });
    const pipe = screen.getByRole('img', {
      name: 'Terminal A to Station B, running, 600 m³/h',
    });
    expect(pipe.getAttribute('d')).toBe('M 0 0 L 4 0');
  });

  it('is decorative (hidden) without a label, so a parent can describe it', () => {
    const { container } = renderPipe();
    expect(path(container).getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('keeps its width on screen however the map is scaled', () => {
    const { container } = renderPipe();
    expect(path(container).getAttribute('vector-effect')).toBe(
      'non-scaling-stroke',
    );
    expect(path(container).getAttribute('fill')).toBe('none');
  });

  it('sets the line width from the flow ratio, in px, as a CSS variable', () => {
    const { container } = renderPipe({ flowRate: 600, maxFlowRate: 1200 });
    expect(path(container).style.getPropertyValue('--pipe-w')).toBe('6px'); // 2 + 0.5 × 8
  });

  it('takes a custom stroke range', () => {
    const { container } = renderPipe({
      flowRate: 1200,
      strokeRange: { min: 1, max: 4 },
    });
    expect(path(container).style.getPropertyValue('--pipe-w')).toBe('4px');
  });

  it.each([
    ['running', 'stroke-line-success', null],
    ['restricted', 'stroke-line-warning', 'stroke-dasharray'],
    ['shutdown', 'stroke-line-neutral', 'stroke-dasharray'],
  ] as const)(
    '%s: its own color class, and a pattern unless running',
    (status, colorClass, pattern) => {
      const { container } = renderPipe({ status });
      const el = path(container);
      expect(el.getAttribute('data-status')).toBe(status);
      expect(el.getAttribute('class')).toContain(colorClass);
      if (pattern) expect(el.getAttribute('class')).toContain(pattern);
      else expect(el.getAttribute('class')).not.toContain('stroke-dasharray');
    },
  );

  it('shutdown dots never shrink below 4px, even at zero flow', () => {
    const { container } = renderPipe({ status: 'shutdown', flowRate: 0 });
    const cls = path(container).getAttribute('class') ?? '';
    expect(cls).toContain('[stroke-width:max(var(--pipe-w),4px)]');
    // cn() drops the base width class, so the minimum isn't overridden.
    expect(cls).not.toContain('[stroke-width:var(--pipe-w)]');
  });

  it('lets className win and passes native attributes and ref through', () => {
    const ref = createRef<SVGPathElement>();
    const { container } = render(
      <svg>
        <PipeSegment
          ref={ref}
          d="M 0 0 L 4 0"
          status="running"
          flowRate={0}
          maxFlowRate={100}
          className="stroke-line-neutral"
          data-segment-id="s1"
        />
      </svg>,
    );
    const el = path(container);
    expect(ref.current).toBe(el);
    expect(el.getAttribute('data-segment-id')).toBe('s1');
    expect(el.getAttribute('class')).toContain('stroke-line-neutral');
    expect(el.getAttribute('class')).not.toContain('stroke-line-success');
  });
});
