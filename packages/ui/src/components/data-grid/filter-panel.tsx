import { useEffect, useState, type RefObject } from 'react';
import { Dialog, Heading, Popover as AriaPopover } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { popoverMotion } from '../../utils/motion';
import { Button } from '../button';
import { CheckboxGroup, CheckboxGroupItem } from '../checkbox-group';
import { DatePicker } from '../date-picker';
import { Field } from '../field';
import { Input } from '../input';
import { NumberField } from '../number-field';
import {
  isActiveFilter,
  type DataGridFilter,
  type DataGridFilterKind,
} from './column-filters';

export type FilterPanelProps = {
  /** The column's name: the panel is titled "Filter Status". */
  label: string;
  kind: DataGridFilterKind;
  /** The column's current filter (the panel starts from it). */
  value: DataGridFilter | undefined;
  /** Choices for a `list` filter. */
  options: readonly string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the panel is anchored to: the column's header cell. */
  triggerRef: RefObject<Element | null>;
  /** Apply (a filter) or Clear (`null`). The panel closes after either. */
  onApply: (filter: DataGridFilter | null) => void;
};

const empty = (kind: DataGridFilterKind): DataGridFilter =>
  kind === 'text'
    ? { kind, contains: '' }
    : kind === 'list'
      ? { kind, values: [] }
      : { kind };

/**
 * The "Filter…" panel under a column header. React Aria `Popover` + `Dialog`, used
 * directly: our `Popover` component brings its own trigger button, but this one opens
 * from a menu item, so it is anchored with `triggerRef` and opened with `isOpen`.
 *
 * Focus: the Dialog takes focus when it opens (Tab then walks its fields), and gives it
 * back to what had focus before (the column's ⌄ button) when it closes.
 *
 * It's a `<form>`: Enter in a field applies, like any form.
 */
export function FilterPanel({
  label,
  kind,
  value,
  options,
  open,
  onOpenChange,
  triggerRef,
  onApply,
}: FilterPanelProps) {
  const [draft, setDraft] = useState<DataGridFilter>(value ?? empty(kind));
  // Each time it opens, start again from the column's current filter.
  useEffect(() => {
    if (open) setDraft(value ?? empty(kind));
  }, [open, value, kind]);

  const finish = (f: DataGridFilter | null) => {
    onApply(f && isActiveFilter(f) ? f : null);
    onOpenChange(false);
  };

  return (
    <AriaPopover
      triggerRef={triggerRef}
      isOpen={open}
      onOpenChange={onOpenChange}
      placement="bottom start"
      offset={4}
      className={cn(
        'w-72 rounded-md border border-border bg-bg text-fg shadow-lg outline-hidden',
        popoverMotion,
      )}
    >
      <Dialog className="outline-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            finish(draft);
          }}
          className="flex flex-col"
        >
          <div className="flex flex-col gap-3 p-4">
            {/* slot="title" names the dialog: "Filter Status, dialog". */}
            <Heading slot="title" className="text-sm font-semibold">
              Filter {label}
            </Heading>
            <FilterFields draft={draft} options={options} onChange={setDraft} />
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
            <Button
              type="button"
              intent="ghost"
              size="sm"
              onClick={() => finish(null)}
            >
              Clear
            </Button>
            <Button type="submit" intent="primary" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </Dialog>
    </AriaPopover>
  );
}

/** The fields for one kind of filter. `switch` on the union's `kind`. */
function FilterFields({
  draft,
  options,
  onChange,
}: {
  draft: DataGridFilter;
  options: readonly string[];
  onChange: (f: DataGridFilter) => void;
}) {
  // `?? undefined`: the fields say "empty" with null; our filter leaves the key out.
  const orUndefined = <T,>(v: T | null) => v ?? undefined;
  switch (draft.kind) {
    case 'text':
      return (
        <Field label="Contains">
          <Input
            size="sm"
            value={draft.contains}
            onChange={(e) => onChange({ ...draft, contains: e.target.value })}
          />
        </Field>
      );
    case 'number':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Field label="At least">
            <NumberField
              size="sm"
              hideStepper
              value={draft.min ?? null}
              onChange={(min) => onChange({ ...draft, min: orUndefined(min) })}
            />
          </Field>
          <Field label="At most">
            <NumberField
              size="sm"
              hideStepper
              value={draft.max ?? null}
              onChange={(max) => onChange({ ...draft, max: orUndefined(max) })}
            />
          </Field>
        </div>
      );
    case 'date':
      return (
        <div className="flex flex-col gap-2">
          <Field label="From">
            <DatePicker
              size="sm"
              value={draft.from ?? null}
              max={draft.to}
              onChange={(from) =>
                onChange({ ...draft, from: orUndefined(from) })
              }
            />
          </Field>
          <Field label="To">
            <DatePicker
              size="sm"
              value={draft.to ?? null}
              min={draft.from}
              onChange={(to) => onChange({ ...draft, to: orUndefined(to) })}
            />
          </Field>
        </div>
      );
    case 'list':
      return (
        <CheckboxGroup
          label="Show rows with"
          size="sm"
          value={draft.values}
          onChange={(values) => onChange({ ...draft, values })}
          // Long lists scroll inside the panel instead of growing past the screen.
          className="max-h-56 overflow-auto"
        >
          {options.map((o) => (
            <CheckboxGroupItem key={o} value={o}>
              {o}
            </CheckboxGroupItem>
          ))}
        </CheckboxGroup>
      );
  }
}
