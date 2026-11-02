import { act, fireEvent, render, screen } from '@testing-library/react';
import { Popover, type PopoverProps } from '../popover';
import {
  Menu,
  MenuItem,
  MenuSection,
  MenuSubmenu,
  type MenuSize,
} from './menu';

/** React Aria moves focus on the next animation frame. */
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key });
    fireEvent.keyUp(document.activeElement ?? document.body, { key });
  });
async function openMenu() {
  act(() => screen.getByRole('button', { name: 'Actions' }).focus());
  press('ArrowDown');
  await nextFrame();
}
const has = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => !el?.classList.contains(c))).toEqual([]);
const lacks = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => el?.classList.contains(c))).toEqual([]);

const trash = (
  <svg viewBox="0 0 16 16">
    <path d="M2 4h12" />
  </svg>
);

function Actions({ menuSize }: { menuSize?: MenuSize }) {
  return (
    <Menu label="Actions" menuSize={menuSize}>
      <MenuSection title="Invoice">
        <MenuItem>Edit</MenuItem>
        <MenuSubmenu label="Export as" icon={trash}>
          <MenuItem>CSV</MenuItem>
        </MenuSubmenu>
      </MenuSection>
      <MenuItem icon={trash} intent="danger" shortcut="Del">
        Delete
      </MenuItem>
    </Menu>
  );
}

describe('Menu styles', () => {
  it('an icon is decorative: the item is still named by its text only', async () => {
    render(<Actions />);
    await openMenu();
    const del = screen.getByRole('menuitem', { name: 'Delete' });
    const icon = del.querySelector('[data-menu-icon]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('menuitem', { name: 'Export as' })).toBeTruthy();
  });

  it('a danger item turns soft red when focused, not gray', async () => {
    render(<Actions />);
    await openMenu();
    const del = screen.getByRole('menuitem', { name: 'Delete' });
    has(del, 'text-fg-danger', 'data-focused:bg-danger-soft');
    lacks(del, 'data-focused:bg-surface');
    lacks(screen.getByRole('menuitem', { name: 'Edit' }), 'text-fg-danger');
  });

  it('md is the default size', async () => {
    render(<Actions />);
    await openMenu();
    has(screen.getByRole('menuitem', { name: 'Edit' }), 'text-sm', 'py-1.5');
  });

  it('menuSize="sm" reaches every item, the submenu item and the section header', async () => {
    render(<Actions menuSize="sm" />);
    await openMenu();
    for (const name of ['Edit', 'Export as', 'Delete'])
      has(screen.getByRole('menuitem', { name }), 'text-xs', 'py-1');
    has(screen.getByText('Invoice'), 'pt-1');
    has(screen.getByRole('menu').parentElement, 'min-w-36');
  });
});

const openPopover = async (
  props: Pick<PopoverProps, 'padding' | 'divided'> = {},
) => {
  render(
    <Popover label="Notifications" title="Notifications" {...props}>
      <p>Body</p>
    </Popover>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
  await nextFrame();
  const dialog = screen.getByRole('dialog');
  return {
    header: dialog.querySelector('header'),
    body: screen.getByText('Body').parentElement,
  };
};

describe('Popover styles', () => {
  it('defaults: md padding, no line under the header', async () => {
    const { header, body } = await openPopover();
    has(body, 'p-4', 'pt-3');
    lacks(header, 'border-b');
  });

  it('padding="sm" tightens the body', async () => {
    const { body } = await openPopover({ padding: 'sm' });
    has(body, 'p-3', 'pt-2');
  });

  it('padding="none" leaves the body edge to edge', async () => {
    const { body } = await openPopover({ padding: 'none' });
    has(body, 'p-0');
    lacks(body, 'p-4');
  });

  it('divided adds a line under the header and drops the extra gap', async () => {
    const { header, body } = await openPopover({ divided: true });
    has(header, 'border-b', 'py-3');
    lacks(body, 'pt-3');
  });
});
