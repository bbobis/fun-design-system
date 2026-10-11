import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { toast, ToastRegion } from './toast';

const meta = {
  title: 'Components/Toast',
  component: ToastRegion,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // The region is rendered once per app; here, once per story.
  decorators: [
    (Story) => (
      <>
        <Story />
        <ToastRegion />
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
