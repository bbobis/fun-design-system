import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Combobox } from '../combobox';
import { DatePicker, DateRangePicker } from '../date-picker';
import { Input } from '../input';
import { MultiCombobox } from '../multi-combobox';
import { NumberField } from '../number-field';
import { SearchField } from '../search-field';
import { Select } from '../select';
import { TextArea } from '../textarea';
import { TimeField } from '../time-field';
import { Field } from './field';
import { fieldSurface, type FieldVariant } from './field-surface';

/**
 * A *contract test*: every text-like field draws its box with the shared
 * `fieldSurface`, for both variants. If someone copies classes into a new field
 * instead of using the recipe, or forgets to pass `variant`, this fails.
 */
const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];
const fields: [string, (v?: FieldVariant) => ReactElement][] = [
  ['Input', (v) => <Input variant={v} />],
  ['TextArea', (v) => <TextArea variant={v} />],
  ['NumberField', (v) => <NumberField variant={v} />],
  ['SearchField', (v) => <SearchField variant={v} />],
  ['Select', (v) => <Select variant={v} options={options} />],
  ['Combobox', (v) => <Combobox variant={v} options={options} />],
  ['MultiCombobox', (v) => <MultiCombobox variant={v} options={options} />],
  ['DatePicker', (v) => <DatePicker variant={v} />],
  ['DateRangePicker', (v) => <DateRangePicker variant={v} />],
  ['TimeField', (v) => <TimeField variant={v} />],
];

/** The element(s) whose classes contain every class of `surface`. */
const boxesWith = (root: HTMLElement, surface: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('[class]')).filter((el) =>
    surface.split(' ').every((c) => el.classList.contains(c)),
  );

describe('fieldSurface contract', () => {
  it.each(fields)(
    '%s: outline by default, filled when asked',
    (_name, make) => {
      const { container, rerender } = render(<Field label="X">{make()}</Field>);
      expect(boxesWith(container, fieldSurface.outline)).toHaveLength(1);
      expect(boxesWith(container, fieldSurface.filled)).toHaveLength(0);

      rerender(<Field label="X">{make('filled')}</Field>);
      expect(boxesWith(container, fieldSurface.filled)).toHaveLength(1);
      expect(boxesWith(container, fieldSurface.outline)).toHaveLength(0);
    },
  );
});
