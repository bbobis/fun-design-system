import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { Button } from '../button';
import { toast, ToastRegion } from './toast';

const meta = {
  title: 'Components/Toast',
  component: ToastRegion,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { variant: 'bar', size: 'md' },
  argTypes: {
    variant: { control: 'radio', options: ['bar', 'soft', 'outline', 'solid'] },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
  // The region is rendered once per app; here, once per story, with the story's args.
  decorators: [
    (Story, { args }) => (
      <>
        <Story />
        <ToastRegion {...args} />
      </>
    ),
  ],
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Press the buttons. Success / info / warning close after 5 s (hover or focus pauses
 * the timer); the error and the one with Undo stay until closed. Press F6 to jump to
 * the toasts with the keyboard, F6 again to jump back.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button intent="secondary" onClick={() => toast.success('Invoice saved')}>
        Success
      </Button>
      <Button
        intent="secondary"
        onClick={() =>
          toast.info('Sync finished', { description: '1,240 rows updated.' })
        }
      >
        Info
      </Button>
      <Button
        intent="secondary"
        onClick={() =>
          toast.warning('Exchange rates are 2 days old', {
            description: 'Totals in USD may be off.',
          })
        }
      >
        Warning
      </Button>
      <Button
        intent="secondary"
        onClick={() =>
          toast.danger('Couldn’t save', {
            description:
              'The server didn’t respond. Your changes are still here.',
          })
        }
      >
        Error (stays)
      </Button>
      <Button
        intent="secondary"
        onClick={() =>
          toast.show({
            title: 'Deleted 3 invoices',
            action: {
              label: 'Undo',
              onAction: () => toast.success('Restored'),
            },
          })
        }
      >
        With Undo (stays)
      </Button>
    </div>
  ),
};

/**
 * Shows four toasts right away (the region shows at most 4) and closes them when you
 * leave the story. Info looks like success here; the Tones story has every tone.
 */
function AllTones() {
  useEffect(() => {
    const keys = [
      toast.show({ title: 'Draft saved', tone: 'neutral' }, { timeout: null }),
      toast.success('Invoice sent', {}, { timeout: null }),
      toast.show(
        {
          title: 'Deleted 3 invoices',
          tone: 'warning',
          action: { label: 'Undo', onAction: () => undefined },
        },
        { timeout: null },
      ),
      toast.danger('Couldn’t save', {
        description: 'The server didn’t respond.',
      }),
    ];
    return () => keys.forEach((k) => toast.dismiss(k));
  }, []);
  return (
    <p className="text-sm text-fg-muted">
      The toasts are in the bottom-right corner. Press F6 to jump to them.
    </p>
  );
}

/** `variant` on `<ToastRegion>`: every toast follows it; each keeps its own tone. */
export const VariantBar: Story = { render: () => <AllTones /> };
export const VariantSoft: Story = {
  args: { variant: 'soft' },
  render: () => <AllTones />,
};
export const VariantOutline: Story = {
  args: { variant: 'outline' },
  render: () => <AllTones />,
};
export const VariantSolid: Story = {
  args: { variant: 'solid' },
  render: () => <AllTones />,
};
/** `size="sm"`: tighter padding and smaller text. */
export const SizeSmall: Story = {
  args: { variant: 'soft', size: 'sm' },
  render: () => <AllTones />,
};
