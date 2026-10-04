import {
  clearErrors,
  countErrors,
  mergeErrors,
  NO_ERRORS,
  validateRows,
} from './validation';

const columns = [
  { id: 'number', label: 'Invoice', meta: undefined }, // read-only: never checked
  {
    id: 'customer',
    label: 'Customer',
    meta: { editor: 'text' as const, required: true },
  },
  {
    id: 'subtotal',
    label: 'Subtotal',
    meta: {
      editor: 'number' as const,
      validate: (v: unknown) =>
        typeof v === 'number' && v <= 0 ? 'Must be more than 0' : undefined,
    },
  },
];
const rows: Record<string, Record<string, unknown>> = {
  a: { number: '', customer: '', subtotal: 5 },
  b: { number: '', customer: 'Acme', subtotal: -1 },
  c: { number: '', customer: 'Ok', subtotal: null },
};
const get = (id: string) => rows[id] ?? {};

describe('validation', () => {
  it('flags required and custom rules on editable columns only', () => {
    expect(validateRows(['a', 'b', 'c'], get, columns)).toEqual({
      a: { customer: 'Customer is required' },
      b: { subtotal: 'Must be more than 0' },
    });
  });

  it('skips custom rules on empty values (that is what required is for)', () => {
    expect(validateRows(['c'], get, columns)).toEqual({});
  });

  it('merges client over server and counts cells', () => {
    const merged = mergeErrors(
      { a: { customer: 'client' } },
      { a: { customer: 'server', subtotal: 'x' } },
    );
    expect(merged).toEqual({ a: { customer: 'client', subtotal: 'x' } });
    expect(countErrors(merged)).toBe(2);
    expect(mergeErrors({ a: { x: '1' } }, NO_ERRORS)).toEqual({
      a: { x: '1' },
    });
  });

  it('clearErrors removes edited cells and empty rows, and keeps identity when nothing changes', () => {
    const errors = {
      a: { customer: 'x' },
      b: { subtotal: 'y', customer: 'z' },
    };
    expect(clearErrors(errors, [{ rowId: 'a', columnId: 'customer' }])).toEqual(
      {
        b: { subtotal: 'y', customer: 'z' },
      },
    );
    expect(clearErrors(errors, [{ rowId: 'c', columnId: 'q' }])).toBe(errors);
  });
});
