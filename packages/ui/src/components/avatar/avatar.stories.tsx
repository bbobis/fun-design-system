import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Avatar, AvatarGroup } from './avatar';

/**
 * A stand-in "photo" as an inline SVG (a data: URL), so stories and screenshots need
 * no network or image files.
 */
const photo = (a: string, b: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fff" fill-opacity=".85"/><path d="M12 60c3-12 11-18 20-18s17 6 20 18z" fill="#fff" fill-opacity=".85"/></svg>`,
  )}`;

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { name: 'Dana Smith' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * With a photo, without one (initials on a color picked from the name), and with a
 * photo that fails to load (404): it shows the initials, never a broken-image icon.
 */
export const PhotoAndFallback: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Dana Smith" src={photo('#0ea5e9', '#6366f1')} />
      <Avatar name="Dana Smith" />
      <Avatar name="Dana Smith" src="/this-photo-does-not-exist.jpg" />
      <Avatar name="Ops Team" shape="square" />
    </div>
  ),
};

/** Each name keeps its color everywhere: the color comes from a hash of the name. */
export const Colors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {[
        'Ann Lee',
        'Bo Chen',
        'Cy Diaz',
        'Di Ng',
        'Ed Park',
        'Flo Ruiz',
        'Gus Ito',
        'Hana Kim',
        'Ivo Petrov',
        'Jo March',
      ].map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <Avatar key={size} name="Dana Smith" size={size} status="online" />
      ))}
    </div>
  ),
};

/**
 * The dot is decoration; the status is also in the name ("Dana Smith, busy"), so it
 * isn't color alone.
 */
export const Status: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Ann Lee" status="online" />
      <Avatar name="Bo Chen" status="away" />
      <Avatar name="Cy Diaz" status="busy" />
      <Avatar name="Di Ng" status="offline" src={photo('#f97316', '#e11d48')} />
    </div>
  ),
};

/**
 * Name printed next to the avatar: make the avatar `decorative`, or screen readers say
 * the name twice.
 */
export const WithName: Story = {
  render: () => (
    <ul className="flex flex-col gap-3">
      {[
        ['Dana Smith', 'Product designer', 'online'],
        ['Bo Chen', 'Engineering manager', 'away'],
      ].map(([name, role, status]) => (
        <li key={name} className="flex items-center gap-3">
          <Avatar
            name={name ?? ''}
            status={status as 'online' | 'away'}
            decorative
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-fg">{name}</span>
            <span className="text-xs text-fg-muted">{role}</span>
          </div>
        </li>
      ))}
    </ul>
  ),
};

const team = [
  'Ann Lee',
  'Bo Chen',
  'Cy Diaz',
  'Di Ng',
  'Ed Park',
  'Flo Ruiz',
  'Gus Ito',
];

/** `max={4}`: four avatars, then "+3". Screen readers hear the hidden names too. */
export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <AvatarGroup label="Assignees">
        {team.map((n, i) => (
          <Avatar
            key={n}
            name={n}
            src={i === 1 ? photo('#22c55e', '#0ea5e9') : undefined}
          />
        ))}
      </AvatarGroup>
      <AvatarGroup label="Viewing now" size="sm" max={2}>
        {team.slice(0, 5).map((n) => (
          <Avatar key={n} name={n} />
        ))}
      </AvatarGroup>
    </div>
  ),
};

/**
 * `onOverflowPress`: "+N" becomes a button. Tab to it: the tooltip lists the hidden
 * names; Enter would open the full list (here it just says so).
 */
export const GroupWithShowAll: Story = {
  render: () => {
    function Example() {
      const [opened, setOpened] = useState(false);
      return (
        <div className="flex flex-col gap-3 pt-10">
          <AvatarGroup
            label="Assignees"
            max={3}
            onOverflowPress={() => setOpened(true)}
          >
            {team.map((n) => (
              <Avatar key={n} name={n} />
            ))}
          </AvatarGroup>
          <p role="status" className="text-sm text-fg-muted">
            {opened ? 'Would open the full list.' : 'Nothing opened yet.'}
          </p>
        </div>
      );
    }
    return <Example />;
  },
};
