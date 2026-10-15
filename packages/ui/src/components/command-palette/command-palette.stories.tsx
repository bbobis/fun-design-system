import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { MenuItem, MenuSection } from '../menu';
import { CommandPalette } from './command-palette';

const meta = {
  title: 'Components/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // Each story renders its own stateful example; these only satisfy the required props.
  args: { open: false, onOpenChange: () => undefined, children: null },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shows what ran, so the stories prove that Enter runs the item and closes the palette. */
function useLastRun() {
  const [last, setLast] = useState<string | null>(null);
  const run = (name: string) => () => setLast(name);
  const status = (
    <p role="status" className="mt-3 text-sm text-fg-muted">
      {last ? `Ran: ${last}` : 'Nothing run yet.'}
    </p>
  );
  return { run, status };
}

/**
 * Press the button, or **⌘K / Ctrl+K** anywhere in the story. Type "inv", use ↑/↓,
 * press Enter. "bills" finds "Go to invoices" through its `keywords`. Escape closes it
 * and focus goes back to the button.
 */
export const Playground: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      const { run, status } = useLastRun();
      return (
        <>
          <Button intent="secondary" onClick={() => setOpen(true)}>
            Search…{' '}
            <kbd className="ms-2 font-mono text-xs">⌘K</kbd>
          </Button>
          {status}
          <CommandPalette open={open} onOpenChange={setOpen}>
            <MenuSection title="Go to">
              <MenuItem onAction={run('Go to invoices')} keywords={['bills']}>
                Go to invoices
              </MenuItem>
              <MenuItem
                onAction={run('Go to customers')}
                keywords={['clients']}
              >
                Go to customers
              </MenuItem>
              <MenuItem onAction={run('Go to reports')}>Go to reports</MenuItem>
            </MenuSection>
            <MenuSection title="Actions">
              <MenuItem onAction={run('New invoice')} shortcut="N">
                New invoice
              </MenuItem>
              <MenuItem
                onAction={run('Export')}
                description="All invoices in the current view"
              >
                Export to CSV
              </MenuItem>
              <MenuItem onAction={run('Archive')} disabled>
                Archive paid invoices
              </MenuItem>
              <MenuItem intent="danger" onAction={run('Sign out')}>
                Sign out
              </MenuItem>
            </MenuSection>
          </CommandPalette>
        </>
      );
    }
    return <Example />;
  },
};

/** Starts open, so you can see it (and so screenshots and audits see it). */
export const Open: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button intent="secondary" onClick={() => setOpen(true)}>
            Open palette
          </Button>
          <CommandPalette open={open} onOpenChange={setOpen}>
            <MenuSection title="Go to">
              <MenuItem keywords={['bills']}>Go to invoices</MenuItem>
              <MenuItem>Go to customers</MenuItem>
            </MenuSection>
            <MenuSection title="Actions">
              <MenuItem shortcut="N">New invoice</MenuItem>
              <MenuItem description="All invoices in the current view">
                Export to CSV
              </MenuItem>
            </MenuSection>
          </CommandPalette>
        </>
      );
    }
    return <Example />;
  },
};

/**
 * Nothing matches: the `emptyState` message gets what was typed. Type "zzz" to see it.
 * Write it as a next step when you can ("Search all invoices for …").
 */
export const CustomEmptyState: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button intent="secondary" onClick={() => setOpen(true)}>
            Open palette
          </Button>
          <CommandPalette
            open={open}
            onOpenChange={setOpen}
            placeholder="Search invoices and actions…"
            emptyState={(search) =>
              `Nothing called “${search}”. Try a customer name or an invoice number.`
            }
          >
            <MenuItem>New invoice</MenuItem>
            <MenuItem>Go to customers</MenuItem>
          </CommandPalette>
        </>
      );
    }
    return <Example />;
  },
};

const customers = Array.from({ length: 60 }, (_, i) => `Customer ${i + 1}`);

/** Many items: the list scrolls; the search box and the key hints stay put. */
export const ManyItems: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button intent="secondary" onClick={() => setOpen(true)}>
            Open palette
          </Button>
          <CommandPalette open={open} onOpenChange={setOpen}>
            <MenuSection title="Customers">
              {customers.map((name) => (
                <MenuItem key={name}>{name}</MenuItem>
              ))}
            </MenuSection>
          </CommandPalette>
        </>
      );
    }
    return <Example />;
  },
};
