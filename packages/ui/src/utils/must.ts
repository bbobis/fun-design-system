/**
 * Returns `value`, or throws when it is `null` or `undefined`. Use it instead of `!`
 * (the non-null assertion): `!` only silences TypeScript, so a wrong guess crashes
 * later with "cannot read properties of null". `must` fails right here and says why.
 *
 * The return type drops `null | undefined` (`NonNullable<T>`), so TypeScript treats
 * the result as present, the same as after an `if (x == null) throw` check.
 *
 * @example
 * const id = must(el.getAttribute('aria-describedby'), 'aria-describedby');
 */
export function must<T>(value: T, what = 'value'): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${what} to be present, got ${String(value)}`);
  }
  return value;
}
