import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button } from '../button';
import { Drawer, type DrawerProps } from './drawer';

/** React Aria moves and restores focus on the next animation frame. */
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

function EditDrawer(props: Partial<DrawerProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit invoice</Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Edit invoice INV-10042"
        description="Northwind Traders"
        footer={<Button onClick={() => setOpen(false)}>Save</Button>}
        {...props}
      >
        <input aria-label="Customer" />
      </Drawer>
    </>
  );
}

async function openIt() {
  const user = userEvent.setup();
  render(<EditDrawer />);
  const trigger = screen.getByRole('button', { name: 'Edit invoice' });
  await user.click(trigger);
  await nextFrame();
  return { user, trigger };
}

describe('Drawer', () => {
  it('is a dialog named by its title and described by its description', async () => {
    await openIt();
    const dialog = screen.getByRole('dialog', {
      name: 'Edit invoice INV-10042',
    });
    const help = screen.getByText('Northwind Traders');
    expect(dialog.getAttribute('aria-describedby')).toBe(help.id);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  it('moves focus in; Escape closes it and focus goes back to the trigger', async () => {
    const { user, trigger } = await openIt();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(
      true,
    );
    await user.keyboard('{Escape}');
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab stays inside while it is open', async () => {
    const { user } = await openIt();
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it('the × button closes it', async () => {
    const { user } = await openIt();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('a click on the dimmed page closes it (by default)', async () => {
    const { user } = await openIt();
    await user.click(screen.getByRole('dialog').closest('.fixed') as Element);
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dismissable={false}: a click on the dimmed page does not close it', async () => {
    const user = userEvent.setup();
    render(<EditDrawer dismissable={false} />);
    await user.click(screen.getByRole('button', { name: 'Edit invoice' }));
    await nextFrame();
    const overlay = screen.getByRole('dialog').closest('.fixed') as Element;
    await user.click(overlay);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it.each([
    ['end', 'justify-end', 'border-s'],
    ['start', 'justify-start', 'border-e'],
  ] as const)(
    'placement="%s" pins it to that side (logical, so it flips in RTL)',
    async (placement, justify, border) => {
      const user = userEvent.setup();
      render(<EditDrawer placement={placement} />);
      await user.click(screen.getByRole('button', { name: 'Edit invoice' }));
      const panel = document.querySelector('[data-placement]') as HTMLElement;
      expect(panel.dataset.placement).toBe(placement);
      expect(panel.className).toContain(border);
      expect(panel.closest('.fixed')?.className).toContain(justify);
    },
  );
});
