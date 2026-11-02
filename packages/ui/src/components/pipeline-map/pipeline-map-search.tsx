import type { ComponentProps } from 'react';
import { Combobox, type ComboboxOption } from '../combobox/combobox';
import { FACILITY_KIND_LABELS, FacilityKindMarker } from './facility-node';
import type { PipelineNetwork } from './pipeline-model';

const numberFormat = new Intl.NumberFormat();

/** A tiny pipe icon for search results: a short line. Decoration only. */
function PipeIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden>
      <path d="M 1 8 L 15 8" className="stroke-fg [stroke-width:2.5]" />
    </svg>
  );
}

/**
 * Every facility, then every pipe, as Combobox options. `value` is the map id, so a
 * pick can go straight to `focusItem(id)`. Exported for tests and custom search UIs.
 *
 * @example
 * searchOptions(network)[0];
 * // { value: 'A', label: 'Terminal A', description: 'terminal', icon: <…/> }
 */
export function searchOptions(network: PipelineNetwork): ComboboxOption[] {
  const name = new Map(network.facilities.map((f) => [f.id, f.label]));
  return [
    ...network.facilities.map((f) => ({
      value: f.id,
      label: f.label,
      description: f.alert
        ? `${FACILITY_KIND_LABELS[f.kind]} · ${f.alert.level}: ${f.alert.message}`
        : FACILITY_KIND_LABELS[f.kind],
      icon: (
        <svg width={16} height={16} viewBox="-12 -12 24 24" aria-hidden>
          <FacilityKindMarker kind={f.kind} />
        </svg>
      ),
    })),
    ...network.segments.map((s) => ({
      value: s.id,
      label: `${name.get(s.from) ?? s.from} → ${name.get(s.to) ?? s.to}`,
      description: `pipe · ${s.status} · ${numberFormat.format(s.flowRate)} m³/h`,
      icon: <PipeIcon />,
    })),
  ];
}

export type PipelineMapSearchProps = Pick<
  ComponentProps<typeof Combobox>,
  'className' | 'placeholder' | 'aria-labelledby' | 'size'
> & {
  /** The same network the map draws. */
  network: PipelineNetwork;
  /**
   * Called with the picked facility or pipe id. Usually:
   * `(id) => mapRef.current?.focusItem(id)` (and select it too, if you like).
   */
  onPick: (id: string) => void;
  /** @default 'Find a facility or pipe' */
  'aria-label'?: string;
};

/**
 * "Find a facility or pipe": type to narrow, ↑/↓ to move, Enter to jump. The search
 * doesn't know about the map: it hands you an id, and you tell the map to focus it
 * through its ref (`PipelineMapHandle.focusItem`).
 *
 * The box clears after each pick, so you can jump again straight away.
 */
export function PipelineMapSearch({
  network,
  onPick,
  'aria-label': ariaLabel = 'Find a facility or pipe',
  placeholder = 'Find a facility or pipe…',
  ...props
}: PipelineMapSearchProps) {
  return (
    <Combobox
      {...props}
      aria-label={ariaLabel}
      placeholder={placeholder}
      options={searchOptions(network)}
      // Controlled at null: nothing stays "chosen", so the box resets after a jump
      // and picking the same item twice still fires.
      value={null}
      onChange={(id) => {
        if (id !== null) onPick(id);
      }}
    />
  );
}
