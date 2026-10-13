import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { AlertDialog } from '../dialog';
import {
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuSubmenu,
} from './menu';

/** React Aria moves and restores focus on the next animation frame. */
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key });
    fireEvent.keyUp(document.activeElement ?? document.body, { key });
  });
const trigger = (name = 'Actions') => screen.getByRole('button', { name });
/** Open with the keyboard, the way a keyboard user does. */
async function openWithKeyboard(name?: string) {
  act(() => trigger(name).focus());
  press('ArrowDown');
  await nextFrame();
}

function Actions({ onEdit = vi.fn(), onDelete = vi.fn() }) {
  return (
    <Menu label="Actions">
      <MenuItem onAction={onEdit}>Edit</MenuItem>
      <MenuItem shortcut="Ctrl+D">Duplicate</MenuItem>
      <MenuItem disabled>Archive</MenuItem>
      <MenuSeparator />
      <MenuItem intent="danger" onAction={onDelete}>
        Delete
      </MenuItem>
    </Menu>
  );
}

describe('Menu', () => {
  it('is a menu button: closed, it says so with aria-expanded', () => {
    render(<Actions />);
    expect(trigger().getAttribute('aria-haspopup')).toBe('true');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('↓ opens it with focus on the first item; arrows move; Enter runs the item', async () => {
    const onDelete = vi.fn();
    render(<Actions onDelete={onDelete} />);
    await openWithKeyboard();
    expect(screen.getByRole('menu')).toBeTruthy();
    // While open, everything outside the menu is aria-hidden, the trigger included.
    expect(
      screen
        .getByRole('button', { name: 'Actions', hidden: true })
        .getAttribute('aria-expanded'),
    ).toBe('true');
    expect(document.activeElement?.textContent).toBe('Edit');
    press('ArrowDown'); // Duplicate
    press('ArrowDown'); // Archive is disabled: skipped
    expect(document.activeElement?.textContent).toContain('Delete');
    press('Enter');
    expect(onDelete).toHaveBeenCalledTimes(1);
    // Closing takes a couple of frames (the page stays aria-hidden until it's done).
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it('Escape closes it and returns focus to the button', async () => {
    render(<Actions />);
    await openWithKeyboard();
    press('Escape');
    await nextFrame();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes, running nothing, when focus leaves it (what Tab does in a browser)', async () => {
    // React Aria lets Tab move focus out of the menu (a menu is not a Tab stop), and
    // the popup closes when focus leaves. jsdom doesn't move focus on Tab, so move it.
    const onEdit = vi.fn();
    render(
      <>
        <Actions onEdit={onEdit} />
        <button>Next field</button>
      </>,
    );
    await openWithKeyboard();
    act(() =>
      screen.getByRole('button', { name: 'Next field', hidden: true }).focus(),
    );
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('a click on an item runs it', async () => {
    const onEdit = vi.fn();
    render(<Actions onEdit={onEdit} />);
    fireEvent.click(trigger());
    await nextFrame();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('disabled items are announced as disabled; the shortcut is shown', async () => {
    render(<Actions />);
    await openWithKeyboard();
    const archive = screen.getByRole('menuitem', { name: 'Archive' });
    expect(archive.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText('Ctrl+D').tagName).toBe('KBD');
  });

  it('an icon-only trigger is named by aria-label', () => {
    render(
      <Menu label="⋯" aria-label="Row actions" chevron={false}>
        <MenuItem>Edit</MenuItem>
      </Menu>,
    );
    expect(trigger('Row actions')).toBeTruthy();
  });
});

function ColumnsMenu({ onChange }: { onChange: (keys: string[]) => void }) {
  const [visible, setVisible] = useState(['customer', 'total']);
  return (
    <Menu label="View">
      <MenuSection
        title="Columns"
        selectionMode="multiple"
        selectedKeys={visible}
        onSelectionChange={(keys) => {
          setVisible(keys);
          onChange(keys);
        }}
      >
        <MenuItem id="customer">Customer</MenuItem>
        <MenuItem id="status">Status</MenuItem>
        <MenuItem id="total">Total</MenuItem>
      </MenuSection>
    </Menu>
  );
}

describe('MenuSection with selectionMode', () => {
  it('items are checkboxes; toggling keeps the menu open and reports string ids', async () => {
    const onChange = vi.fn();
    render(<ColumnsMenu onChange={onChange} />);
    await openWithKeyboard('View');
    const status = screen.getByRole('menuitemcheckbox', { name: 'Status' });
    expect(status.getAttribute('aria-checked')).toBe('false');
    expect(
      screen
        .getByRole('menuitemcheckbox', { name: 'Customer' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    fireEvent.click(status);
    expect(onChange).toHaveBeenLastCalledWith(['customer', 'total', 'status']);
    expect(screen.getByRole('menu')).toBeTruthy(); // still open
    expect(status.getAttribute('aria-checked')).toBe('true');
  });

  it('the section is a group named by its title', async () => {
    render(<ColumnsMenu onChange={vi.fn()} />);
    await openWithKeyboard('View');
    expect(screen.getByRole('group', { name: 'Columns' })).toBeTruthy();
  });
});

describe('Menu → AlertDialog', () => {
  it('an item that opens a dialog: focus goes into the dialog, not back to the menu button', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Menu label="Actions">
            <MenuItem intent="danger" onAction={() => setOpen(true)}>
              Delete…
            </MenuItem>
          </Menu>
          <AlertDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete it?"
            confirmLabel="Delete"
            onConfirm={() => undefined}
          />
        </>
      );
    }
    render(<Example />);
    await openWithKeyboard();
    press('Enter');
    await nextFrame();
    await nextFrame();
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Cancel' }),
    );
    // Closing the dialog then returns focus to the menu button, the last real "place".
    press('Escape');
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });
});

function WithExport({ onCsv = vi.fn() }) {
  return (
    <Menu label="Actions">
      <MenuItem>Edit</MenuItem>
      <MenuSubmenu label="Export as">
        <MenuItem onAction={onCsv}>CSV</MenuItem>
        <MenuItem>PDF</MenuItem>
      </MenuSubmenu>
    </Menu>
  );
}
const focused = () => document.activeElement?.textContent;

describe('MenuSubmenu', () => {
  it('the parent item says it opens a menu', async () => {
    render(<WithExport />);
    await openWithKeyboard();
    const item = screen.getByRole('menuitem', { name: 'Export as' });
    expect(item.getAttribute('aria-haspopup')).toBe('menu');
    expect(item.getAttribute('aria-expanded')).toBe('false');
  });

  it('→ opens it on its first item; ← closes it and returns to the parent', async () => {
    render(<WithExport />);
    await openWithKeyboard();
    press('ArrowDown'); // Edit → Export as
    expect(focused()).toBe('Export as');
    press('ArrowRight');
    await nextFrame();
    expect(screen.getAllByRole('menu')).toHaveLength(2);
    expect(focused()).toBe('CSV');
    press('ArrowLeft');
    await nextFrame();
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(focused()).toBe('Export as');
  });

  it('choosing an item in the submenu runs it and closes everything', async () => {
    const onCsv = vi.fn();
    render(<WithExport onCsv={onCsv} />);
    await openWithKeyboard();
    press('ArrowDown');
    press('ArrowRight');
    await nextFrame();
    press('Enter');
    await nextFrame();
    expect(onCsv).toHaveBeenCalledTimes(1);
    expect(screen.queryAllByRole('menu')).toHaveLength(0);
    expect(document.activeElement).toBe(trigger());
  });

  it('Escape in the submenu closes only the submenu', async () => {
    render(<WithExport />);
    await openWithKeyboard();
    press('ArrowDown');
    press('ArrowRight');
    await nextFrame();
    press('Escape');
    await nextFrame();
    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(focused()).toBe('Export as');
  });
});
