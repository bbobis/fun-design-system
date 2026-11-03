import { useEffect, useId, useState } from 'react';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Combobox } from '../combobox';
import { DatePicker } from '../date-picker';
import { Drawer } from '../drawer';
import { Field } from '../field';
import { Input } from '../input';
import { NumberField } from '../number-field';
import { Select } from '../select';
import { TextArea } from '../textarea';
import type { DataGridColumnMeta } from './data-grid-features';
import { sameValue } from './editing/draft';
import { useServerSearch } from './editing/use-server-search';

export type RecordField = {
  id: string;
  label: string;
  meta: DataGridColumnMeta;
  /** The value the row shows now (draft included). */
  value: unknown;
};

export type RecordDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Edit INV-10003". Names the drawer. */
  title: string;
  /** The editable columns (those with `meta.editor`). */
  fields: readonly RecordField[];
  /** The other columns, shown as text so the form has the whole row's context. */
  readOnly: readonly { id: string; label: string; text: string }[];
  /** The row's errors for these values: the same `required` / `validate` rules as the grid. */
  validate: (
    values: Readonly<Record<string, unknown>>,
  ) => Record<string, string>;
  /** Apply: only the fields that changed. The grid records them as one undo step. */
  onApply: (changes: Record<string, unknown>) => void;
};

/**
 * One row as a form, in our `Drawer`. For rows with long text or many columns, where
 * editing cell by cell is cramped. Apply goes into the grid's draft like any edit
 * (nothing is saved until "Save all"), so Undo and Discard work on it too.
 *
 * The drawer is a modal dialog: while it's open, the grid behind it can't be reached
 * by Tab, the mouse or a screen reader, and when it closes focus returns to "Edit row".
 */
export function RecordDrawer({
  open,
  onOpenChange,
  title,
  fields,
  readOnly,
  validate,
  onApply,
}: RecordDrawerProps) {
  const formId = useId();
  const initial = () => Object.fromEntries(fields.map((f) => [f.id, f.value]));
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  // Each time it opens, start from the row as it is now.
  useEffect(() => {
    if (open) setValues(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open only
  }, [open]);
  const errors = validate(values);
  const set = (id: string, value: unknown) =>
    setValues((v) => ({ ...v, [id]: value }));

  const apply = () => {
    const changes: Record<string, unknown> = {};
    for (const f of fields)
      if (!sameValue(values[f.id], f.value)) changes[f.id] = values[f.id];
    onApply(changes);
    onOpenChange(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Changes go into your edits. Nothing is saved until Save all."
      // Typed work: a stray click on the page shouldn't throw it away.
      dismissable={false}
      size="md"
      footer={
        <>
          <Button intent="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {/* The submit button can sit outside its form: `form` links them. */}
          <Button type="submit" form={formId} intent="primary">
            Apply
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="flex flex-col gap-4"
      >
        {fields.map((f) => (
          <FieldFor
            key={f.id}
            field={f}
            value={values[f.id]}
            error={errors[f.id]}
            onChange={(v) => set(f.id, v)}
          />
        ))}
        {readOnly.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border pt-4 text-sm">
            {readOnly.map((r) => (
              <div key={r.id} className="contents">
                <dt className="text-fg-muted">{r.label}</dt>
                <dd className="text-fg">{r.text || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
      </form>
    </Drawer>
  );
}

/** The form control for one column: the "form" version of its cell editor. */
function FieldFor({
  field,
  value,
  error,
  onChange,
}: {
  field: RecordField;
  value: unknown;
  error: string | undefined;
  onChange: (value: unknown) => void;
}) {
  const { label, meta } = field;
  const asText = value == null ? '' : String(value);
  if (meta.editor === 'checkbox')
    return (
      <label className="flex items-center gap-2 text-sm text-fg">
        <Checkbox
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  return (
    <Field label={label} required={meta.required} error={error}>
      {meta.editor === 'number' ? (
        <NumberField
          value={typeof value === 'number' ? value : null}
          onChange={onChange}
        />
      ) : meta.editor === 'select' ? (
        <Select
          options={(meta.options ?? []).map((o) => ({ value: o, label: o }))}
          value={asText || null}
          onChange={onChange}
        />
      ) : meta.editor === 'combobox' ? (
        <SearchableField meta={meta} value={asText} onChange={onChange} />
      ) : meta.editor === 'date' ? (
        <DatePicker value={asText || null} onChange={onChange} />
      ) : meta.multiline ? (
        <TextArea
          rows={4}
          value={asText}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input value={asText} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

/** A `combobox` column: its `options`, or `searchOptions` through the same hook as the cell. */
function SearchableField({
  meta,
  value,
  onChange,
}: {
  meta: DataGridColumnMeta;
  value: string;
  onChange: (value: unknown) => void;
}) {
  const { results, loading, search } = useServerSearch(meta.searchOptions);
  const server = meta.searchOptions !== undefined;
  const toOptions = (list: readonly string[]) =>
    list.map((o) => ({ value: o, label: o }));
  return (
    <Combobox
      options={toOptions(server ? (results ?? []) : (meta.options ?? []))}
      // The current value may not be in the latest search results: name it anyway.
      selectedOptions={value ? toOptions([value]) : []}
      value={value || null}
      onChange={onChange}
      filter={server ? 'none' : 'contains'}
      onInputChange={server ? search : undefined}
      loading={server && loading}
    />
  );
}
