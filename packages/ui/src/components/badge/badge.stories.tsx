import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Pending', tone: 'warning' },
  argTypes: {
    tone: {
      control: 'radio',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    variant: { control: 'radio', options: ['soft', 'solid', 'outline'] },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral">Draft</Badge>
      <Badge tone="info">Sent</Badge>
      <Badge tone="success">Paid</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Overdue</Badge>
    </div>
  ),
};

const statuses = [
  ['neutral', 'Draft'],
  ['info', 'Sent'],
  ['success', 'Paid'],
  ['warning', 'Pending'],
  ['danger', 'Overdue'],
] as const;

/**
 * Every tone in every `variant`: `soft` (default), `solid` (the one state that must
 * stand out), `outline` (dense tables). axe checks the contrast of each one.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['soft', 'solid', 'outline'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs text-fg-muted">{variant}</span>
          {statuses.map(([tone, label]) => (
            <Badge key={tone} tone={tone} variant={variant}>
              {label}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** `dot`: a small status dot. Decoration: the text still says the state. */
export const Dots: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['soft', 'solid', 'outline'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap gap-2">
          <Badge dot tone="success" variant={variant}>
            Online
          </Badge>
          <Badge dot tone="warning" variant={variant}>
            Away
          </Badge>
          <Badge dot tone="danger" variant={variant}>
            Offline
          </Badge>
          <Badge dot tone="neutral" variant={variant}>
            Unknown
          </Badge>
        </div>
      ))}
    </div>
  ),
};

/** `size="sm"` for table cells and tight rows; `md` (default) elsewhere. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md'] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-2">
          {statuses.map(([tone, label]) => (
            <Badge key={tone} tone={tone} size={size} dot>
              {label}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

const CheckIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-full"
  >
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);
const AlertIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    className="size-full"
  >
    <path d="M8 4v5M8 12h0" />
  </svg>
);

/** `icon`: a small icon before the text. Hidden from screen readers. */
export const Icons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="success" icon={<CheckIcon />}>
        Paid
      </Badge>
      <Badge tone="danger" variant="solid" icon={<AlertIcon />}>
        Overdue
      </Badge>
      <Badge tone="info" variant="outline" icon={<CheckIcon />}>
        Verified
      </Badge>
      <Badge tone="success" size="sm" icon={<CheckIcon />}>
        Paid
      </Badge>
    </div>
  ),
};
