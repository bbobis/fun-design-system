import { useMemo, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { FACILITY_KIND_LABELS } from './facility-node';
import type { Facility, PipelineNetwork } from './pipeline-model';
import { tankFill } from './tank-gauge';

const numberFormat = new Intl.NumberFormat();
const n = (value: number) => numberFormat.format(value);

/** Same look as the DataGrid: quiet headers, dividers between rows. */
const th =
  'h-9 border-y border-border px-3 text-start text-xs font-medium whitespace-nowrap text-fg-muted';
const td = 'border-b border-border px-3 py-2 align-top';
const caption = 'mb-2 text-start text-sm font-semibold text-fg';
const row = cn(
  'hover:bg-surface',
  // Selected: the DataGrid's soft wash + 2px leading rail (inset shadow: nothing shifts).
  'data-selected:bg-primary/10 data-selected:shadow-[inset_2px_0_0_var(--color-primary)]',
);

/** The first cell: a button that selects the item when the table is wired to a map. */
function NameCell({
  id,
  children,
  selected,
  onSelect,
}: {
  id: string;
  children: ReactNode;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    // A row header: screen readers say "Station B" before each cell in that row.
    <th scope="row" className={cn(td, 'text-start font-medium')}>
      {onSelect ? (
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onSelect(id)}
          className="cursor-pointer rounded-sm text-start underline decoration-link-underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {children}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export type PipelineMapTableProps = Omit<
  ComponentProps<'div'>,
  'children' | 'onSelect'
> & {
  /** The same network the map draws. */
  network: PipelineNetwork;
  /** Highlights this pipe's or facility's row (pass the map's `selectedId`). */
  selectedId?: string | null;
  /**
   * When given, each row's name becomes a button that calls this with its id: wire it
   * to the map's `onSelect` to keep the two in sync.
   */
  onSelect?: (id: string) => void;
  /** Highlights this batch's lines (pass the map's `followedBatch`). */
  followedBatch?: string | null;
  /**
   * When given, each batch becomes a toggle button that calls this with its name
   * (or `null` to stop). Wire it to the map's `onFollowBatchChange`: it's the
   * keyboard-friendly way to follow a batch, and lists every batch in one place.
   */
  onFollowBatch?: (name: string | null) => void;
};

/**
 * The Pipeline Map's data as two real tables, Pipes and Facilities. It is the
 * accessible alternative to the drawing: every number on the map is here as text,
 * readable with a screen reader's table commands, copyable, and printable.
 *
 * Plain `<table>`, not `DataGrid`: it's small and read-only, and a semantic table is
 * what screen readers handle best. Optionally in sync with the map via
 * `selectedId` / `onSelect`.
 */
export function PipelineMapTable({
  network,
  selectedId = null,
  onSelect,
  followedBatch = null,
  onFollowBatch,
  className,
  ...props
}: PipelineMapTableProps) {
  const byId = useMemo(
    () => new Map<string, Facility>(network.facilities.map((f) => [f.id, f])),
    [network.facilities],
  );
  const name = (id: string) => byId.get(id)?.label ?? id;

  return (
    <div
      {...props}
      className={cn('flex flex-col gap-6 text-sm text-fg', className)}
    >
      <table className="w-full border-collapse">
        <caption className={caption}>Pipes</caption>
        <thead>
          <tr>
            <th scope="col" className={th}>
              Route
            </th>
            <th scope="col" className={th}>
              Status
            </th>
            <th scope="col" className={cn(th, 'text-end')}>
              Flow (m³/h)
            </th>
            <th scope="col" className={th}>
              Batches, downstream first
            </th>
          </tr>
        </thead>
        <tbody>
          {network.segments.map((s) => (
            <tr
              key={s.id}
              data-selected={s.id === selectedId || undefined}
              className={row}
            >
              <NameCell
                id={s.id}
                selected={s.id === selectedId}
                onSelect={onSelect}
              >
                {name(s.from)} → {name(s.to)}
              </NameCell>
              <td className={td}>{s.status}</td>
              <td className={cn(td, 'text-end tabular-nums')}>
                {n(s.flowRate)}{' '}
                <span className="text-fg-muted">of {n(s.maxFlowRate)}</span>
              </td>
              <td className={td}>
                {s.batches.length === 0 ? (
                  <span className="text-fg-muted">None</span>
                ) : (
                  <ul className="flex flex-col gap-0.5 tabular-nums">
                    {s.batches.map((b) => {
                      const text = `${b.name} · ${b.product} · ${n(b.volume)} m³`;
                      const followed = b.name === followedBatch;
                      return (
                        <li key={b.name}>
                          {onFollowBatch ? (
                            <button
                              type="button"
                              aria-pressed={followed}
                              onClick={() =>
                                onFollowBatch(followed ? null : b.name)
                              }
                              className={cn(
                                '-mx-1 cursor-pointer rounded-sm px-1 text-start tabular-nums hover:bg-surface',
                                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring',
                                // Followed: wash + bold, so it isn't color alone.
                                'aria-pressed:bg-primary/10 aria-pressed:font-semibold',
                              )}
                            >
                              {text}
                            </button>
                          ) : (
                            text
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <caption className={caption}>Facilities</caption>
        <thead>
          <tr>
            <th scope="col" className={th}>
              Facility
            </th>
            <th scope="col" className={th}>
              Kind
            </th>
            <th scope="col" className={th}>
              Alert
            </th>
            <th scope="col" className={th}>
              Tanks
            </th>
          </tr>
        </thead>
        <tbody>
          {network.facilities.map((f) => (
            <tr
              key={f.id}
              data-selected={f.id === selectedId || undefined}
              className={row}
            >
              <NameCell
                id={f.id}
                selected={f.id === selectedId}
                onSelect={onSelect}
              >
                {f.label}
              </NameCell>
              <td className={td}>{FACILITY_KIND_LABELS[f.kind]}</td>
              <td className={td}>
                {f.alert ? (
                  <span
                    className={
                      f.alert.level === 'danger' ? 'text-fg-danger' : undefined
                    }
                  >
                    <span className="font-medium">
                      {f.alert.level === 'danger' ? 'Danger' : 'Warning'}:
                    </span>{' '}
                    {f.alert.message}
                  </span>
                ) : (
                  <span className="text-fg-muted">None</span>
                )}
              </td>
              <td className={td}>
                {f.tanks?.length ? (
                  <ul className="flex flex-col gap-0.5 tabular-nums">
                    {f.tanks.map((t) => (
                      <li key={t.id}>
                        {t.label} · {Math.round(tankFill(t) * 100)}% ·{' '}
                        {n(t.volume)} of {n(t.capacity)} m³
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-fg-muted">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
