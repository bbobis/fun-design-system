import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Checkbox } from './checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Example',
    indeterminate: false,
    disabled: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every state side by side. Hover and Tab onto them to see hover and focus. */
export const States: Story = {
  render: () => (
    <div className="flex items-center gap-6 text-sm text-fg">
      <label className="flex items-center gap-2">
        <Checkbox /> Off
      </label>
      <label className="flex items-center gap-2">
        <Checkbox defaultChecked /> On
      </label>
      <label className="flex items-center gap-2">
        <Checkbox indeterminate /> Mixed
      </label>
      <label className="flex items-center gap-2 text-fg-muted">
        <Checkbox disabled /> Disabled
      </label>
      <label className="flex items-center gap-2 text-fg-muted">
        <Checkbox disabled defaultChecked /> Disabled on
      </label>
    </div>
  ),
};

/** The classic "select all" pattern: the parent is mixed when only some are on. */
export const SelectAll: Story = {
  render: () => {
    function Example() {
      const items = ['Invoices', 'Credit notes', 'Receipts'];
      const [on, setOn] = useState<string[]>(['Invoices']);
      const all = on.length === items.length;
      return (
        <fieldset className="flex flex-col gap-2 text-sm text-fg">
          <legend className="sr-only">Documents to export</legend>
          <label className="flex items-center gap-2 font-medium">
            <Checkbox
              checked={all}
              indeterminate={on.length > 0 && !all}
              onChange={() => setOn(all ? [] : items)}
            />
            All documents
          </label>
          {items.map((item) => (
            <label key={item} className="ms-6 flex items-center gap-2">
              <Checkbox
                checked={on.includes(item)}
                onChange={() =>
                  setOn((prev) =>
                    prev.includes(item)
                      ? prev.filter((i) => i !== item)
                      : [...prev, item],
                  )
                }
              />
              {item}
            </label>
          ))}
        </fieldset>
      );
    }
    return <Example />;
  },
};
