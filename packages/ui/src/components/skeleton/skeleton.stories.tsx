import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { Skeleton } from './skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shapes: Story = {
  render: () => (
    <div className="flex max-w-sm items-center gap-3">
      <Skeleton shape="circle" className="size-10" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="w-1/2" />
        <Skeleton className="w-5/6" />
      </div>
    </div>
  ),
};

/**
 * The real pattern: the region says `aria-busy` while loading, and a hidden status
 * line says "Loading invoice…" once; the gray boxes themselves are silent.
 * Toggle to see the content arrive in the same space (no jump).
 */
export const LoadingACard: Story = {
  render: () => {
    function Example() {
      const [loading, setLoading] = useState(true);
      return (
        <div className="flex max-w-sm flex-col gap-3">
          <Button
            size="sm"
            intent="secondary"
            className="self-start"
            onClick={() => setLoading((l) => !l)}
          >
            {loading ? 'Finish loading' : 'Load again'}
          </Button>
          <section
            aria-label="Invoice INV-10042"
            aria-busy={loading}
            className="rounded-md border border-border p-4"
          >
            <p role="status" className="sr-only">
              {loading ? 'Loading invoice…' : ''}
            </p>
            {loading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="w-1/3 text-lg" />
                <Skeleton className="w-2/3" />
                <Skeleton className="w-1/2" />
              </div>
            ) : (
              <div className="flex flex-col gap-2 text-sm">
                <p className="text-lg font-semibold">INV-10042</p>
                <p>Northwind Traders · 12,450.00 CAD</p>
                <p className="text-fg-muted">Due 2026-11-03</p>
              </div>
            )}
          </section>
        </div>
      );
    }
    return <Example />;
  },
};
