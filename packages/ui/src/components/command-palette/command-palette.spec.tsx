import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button } from '../button';
import { MenuItem, MenuSection } from '../menu';
import { CommandPalette, type CommandPaletteProps } from './command-palette';

/** React Aria moves and restores focus on the next animation frame. */
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

function Palette({
  onNew = () => undefined,
  ...props
}: Partial<CommandPaletteProps> & { onNew?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Search</Button>
      <CommandPalette open={open} onOpenChange={setOpen} {...props}>
        <MenuSection title="Go to">
          <MenuItem keywords={['bills']}>Go to invoices</MenuItem>
          <MenuItem>Go to customers</MenuItem>
        </MenuSection>
        <MenuSection title="Actions">
          <MenuItem onAction={onNew}>New invoice</MenuItem>
          <MenuItem disabled>Archive</MenuItem>
        </MenuSection>
      </CommandPalette>
    </>
  );
}

async function openIt(props?: Parameters<typeof Palette>[0]) {
  const user = userEvent.setup();
  render(<Palette {...props} />);
  const trigger = screen.getByRole('button', { name: 'Search' });
  await user.click(trigger);
  await nextFrame();
  return { user, trigger, input: screen.getByRole('searchbox') };
}

const items = () => screen.queryAllByRole('menuitem').map((i) => i.textContent);

describe('CommandPalette', () => {
  it('is a named dialog; focus starts in the search box', async () => {
    const { input } = await openIt();
    expect(
      screen.getByRole('dialog', { name: 'Command palette' }),
    ).toBeTruthy();
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-label')).toBe('Type a command or search…');
    expect(screen.getByRole('group', { name: 'Go to' })).toBeTruthy();
  });

  it('typing filters (contains, any case), keywords included; empty sections go', async () => {
    const { user } = await openIt();
    await user.keyboard('INV');
    expect(items()).toEqual(['Go to invoices', 'New invoice']);
    await user.clear(screen.getByRole('searchbox'));
    await user.keyboard('bills');
    expect(items()).toEqual(['Go to invoices']);
    expect(screen.queryByRole('group', { name: 'Actions' })).toBeNull();
  });

  it('nothing matches: the empty message says what was typed', async () => {
    const { user } = await openIt();
    await user.keyboard('zzz');
    // React Aria puts the empty message in a row of its own, so a screen reader moving
    // through the empty list still finds something to read.
    expect(items()).toEqual(['No results for “zzz”']);
  });

  it('↑/↓ move a virtual focus: real focus stays in the box (aria-activedescendant)', async () => {
    const { user, input } = await openIt();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.activeElement).toBe(input);
    const active = document.getElementById(
      input.getAttribute('aria-activedescendant') ?? '',
    );
    expect(active?.textContent).toBe('Go to customers');
  });

  it('Enter runs the item, closes the palette, and focus goes back to the trigger', async () => {
    const onNew = vi.fn();
    const { user, trigger } = await openIt({ onNew });
    await user.keyboard('new{Enter}');
    expect(onNew).toHaveBeenCalledTimes(1);
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('disabled items stay visible but cannot run', async () => {
    const { user } = await openIt();
    const archive = screen.getByRole('menuitem', { name: 'Archive' });
    expect(archive.getAttribute('aria-disabled')).toBe('true');
    await user.click(archive);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('Escape closes it', async () => {
    const { user, trigger } = await openIt();
    await user.keyboard('{Escape}');
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('⌘K / Ctrl+K toggles it; openShortcut={false} turns that off', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Palette />);
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeTruthy();
    await user.keyboard('{Meta>}k{/Meta}');
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();

    render(<Palette openShortcut={false} />);
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
