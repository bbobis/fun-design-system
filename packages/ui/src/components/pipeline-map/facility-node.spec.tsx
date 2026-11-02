import { render, screen } from '@testing-library/react';
import {
  FacilityNode,
  facilityLabel,
  type FacilityNodeProps,
} from './facility-node';

const renderNode = (props: Partial<FacilityNodeProps> = {}) =>
  render(
    <svg>
      <FacilityNode
        position={{ x: 4, y: 2 }}
        unitsPerPx={0.025}
        label="Tank Farm C"
        kind="tank-farm"
        {...props}
      />
    </svg>,
  );

describe('facilityLabel', () => {
  it('says the name and kind', () => {
    expect(facilityLabel({ label: 'Station B', kind: 'pump-station' })).toBe(
      'Station B, pump station',
    );
  });

  it('adds the alert level and message', () => {
    expect(
      facilityLabel({
        label: 'Tank Farm C',
        kind: 'tank-farm',
        alert: { level: 'danger', message: 'Tank 3 overfill' },
      }),
    ).toBe('Tank Farm C, tank farm. Danger: Tank 3 overfill');
  });
});

describe('FacilityNode', () => {
  it('is one named image (the visible label is hidden to avoid saying it twice)', () => {
    const { container } = renderNode();
    expect(
      screen.getByRole('img', { name: 'Tank Farm C, tank farm' }),
    ).toBeTruthy();
    expect(container.querySelector('text')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('sits at its grid point and draws in pixels (scale = units per px)', () => {
    renderNode();
    expect(screen.getByRole('img').getAttribute('transform')).toBe(
      'translate(4 2) scale(0.025)',
    );
  });

  it.each(['terminal', 'pump-station', 'tank-farm', 'refinery'] as const)(
    '%s gets its own shape',
    (kind) => {
      renderNode({ kind });
      expect(screen.getByRole('img').getAttribute('data-kind')).toBe(kind);
    },
  );

  it('shows an alert badge whose shape follows the level', () => {
    const { container, rerender } = renderNode({
      alert: { level: 'warning', message: 'High level' },
    });
    expect(container.querySelector('[data-alert="warning"] path')).toBeTruthy();
    rerender(
      <svg>
        <FacilityNode
          position={{ x: 0, y: 0 }}
          unitsPerPx={1}
          label="X"
          kind="terminal"
          alert={{ level: 'danger', message: 'Leak' }}
        />
      </svg>,
    );
    expect(
      container.querySelector('[data-alert="danger"] circle'),
    ).toBeTruthy();
  });

  it('can take focus when the map gives it a tab stop, and shows selection', () => {
    renderNode({ tabIndex: 0, selected: true });
    const node = screen.getByRole('img');
    node.focus();
    expect(document.activeElement).toBe(node);
    expect(node.getAttribute('data-selected')).toBe('true');
  });

  it('selection and focus look different: halo + solid marker vs a ring', () => {
    const { container } = renderNode({ selected: true });
    expect(container.querySelector('[data-selection-halo]')).toBeTruthy();
    expect(container.querySelector('g.fill-fg')).toBeTruthy();
    const unselected = renderNode();
    expect(
      unselected.container.querySelector('[data-selection-halo]'),
    ).toBeNull();
    expect(unselected.container.querySelector('g.fill-bg')).toBeTruthy();
  });

  it('draws a centred tank gauge and puts its summary in the name', () => {
    const { container } = renderNode({
      tanks: [
        { id: 'T-1', label: 'T-1', volume: 82, capacity: 100 },
        { id: 'T-2', label: 'T-2', volume: 45, capacity: 100 },
        { id: 'T-3', label: 'T-3', volume: 96, capacity: 100 },
      ],
    });
    expect(
      screen.getByRole('img', {
        name: 'Tank Farm C, tank farm. 3 tanks, 74% full on average. T-3 96%, high',
      }),
    ).toBeTruthy();
    expect(container.querySelectorAll('[data-tank]')).toHaveLength(3);
    // Only one image: the gauge inside is hidden, its words are in the node's name.
    expect(screen.getAllByRole('img')).toHaveLength(1);
    const gauge = container.querySelector('[data-tank]')?.parentElement;
    expect(gauge?.getAttribute('transform')).toBe('translate(-34 44)');
  });

  it('passes className and native attributes through', () => {
    renderNode({
      className: 'opacity-50',
      'data-facility-id': 'C',
    } as Partial<FacilityNodeProps>);
    const node = screen.getByRole('img');
    expect(node.getAttribute('class')).toContain('opacity-50');
    expect(node.getAttribute('data-facility-id')).toBe('C');
  });
});
