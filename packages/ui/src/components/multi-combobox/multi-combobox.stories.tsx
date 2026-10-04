import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { Field } from '../field';
import { MultiCombobox, type MultiComboboxOption } from './multi-combobox';

const skills: MultiComboboxOption[] = [
  'Accessibility',
  'Angular',
  'AWS',
  'Azure',
  'CSS',
  'Docker',
  'GraphQL',
  'Java',
  'Kafka',
  'Kotlin',
  'Kubernetes',
  'Node.js',
  'PostgreSQL',
  'Python',
  'React',
  'Spring Boot',
  'SQL Server',
  'Tailwind CSS',
  'Terraform',
  'TypeScript',
].map((label) => ({ value: label.toLowerCase().replace(/\W+/g, '-'), label }));

const meta = {
  title: 'Components/MultiCombobox',
  component: MultiCombobox,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Skills',
    options: skills,
    placeholder: 'Add skills',
    filter: 'contains',
    size: 'md',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    filter: { control: 'radio', options: ['contains', 'startsWith'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MultiCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Type, Enter to add (the list stays open), Backspace in the empty input to remove the
 * last tag. Shift+Tab from the input reaches the tags: ←/→ to move, Delete to remove.
 */
export const Playground: Story = {};

export const InAField: Story = {
  render: () => (
    <Field
      label="Skills"
      description="Pick everything you'd be happy to work on."
      required
    >
      <MultiCombobox
        options={skills}
        defaultValue={['react', 'typescript']}
        placeholder="Add skills"
      />
    </Field>
  ),
};

/** Tags wrap onto new lines and the box grows. The list still opens below the whole box. */
export const ManyTags: Story = {
  args: {
    defaultValue: [
      'react',
      'typescript',
      'tailwind-css',
      'spring-boot',
      'postgresql',
      'kafka',
      'docker',
      'kubernetes',
    ],
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <MultiCombobox
          key={size}
          {...args}
          size={size}
          aria-label={`Skills ${size}`}
          defaultValue={['react', 'java']}
        />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ['react', 'java'] },
};

const customers: MultiComboboxOption[] = Array.from(
  { length: 10_000 },
  (_, i) => ({
    value: `cust-${i + 1}`,
    label: `Customer ${String(i + 1).padStart(5, '0')}`,
  }),
);

function searchCustomers(
  query: string,
  signal: AbortSignal,
): Promise<MultiComboboxOption[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase();
      resolve(
        q
          ? customers
              .filter((c) => c.label.toLowerCase().includes(q))
              .slice(0, 50)
          : [],
      );
    }, 400);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/**
 * The app fetches; the MultiCombobox shows what comes back. Tags keep their labels even
 * after a new search no longer returns them.
 */
export const ServerSearch: Story = {
  render: () => {
    function Example() {
      const [query, setQuery] = useState('');
      const [results, setResults] = useState<MultiComboboxOption[]>([]);
      const [loading, setLoading] = useState(false);
      const [value, setValue] = useState<string[]>([]);

      useEffect(() => {
        if (!query.trim()) return setResults([]);
        const controller = new AbortController();
        setLoading(true);
        const timer = setTimeout(() => {
          searchCustomers(query, controller.signal)
            .then(setResults)
            .catch(() => undefined) // aborted: a newer request is coming
            .finally(() => !controller.signal.aborted && setLoading(false));
        }, 250);
        return () => {
          clearTimeout(timer);
          controller.abort();
        };
      }, [query]);

      return (
        <div className="flex flex-col gap-2">
          <Field label="Customers" description="Try “00042”, then “123”.">
            <MultiCombobox
              filter="none"
              options={results}
              onInputChange={setQuery}
              loading={loading}
              value={value}
              onChange={setValue}
              placeholder="Search 10,000 customers"
              emptyMessage={
                query ? 'No customers found' : 'Start typing to search'
              }
            />
          </Field>
          <p className="text-sm text-fg-muted">
            Picked: {value.length ? value.join(', ') : 'nothing'}
          </p>
        </div>
      );
    }
    return <Example />;
  },
};
