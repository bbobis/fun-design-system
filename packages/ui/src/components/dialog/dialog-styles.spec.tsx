import { render, screen, within } from '@testing-library/react';
import { Drawer, type DrawerProps } from '../drawer';
import {
  AlertDialog,
  Dialog,
  type AlertDialogProps,
  type DialogProps,
} from './dialog';

// role=dialog/alertdialog is React Aria's Dialog; its parent is the panel (Modal),
// whose parent is the dimmed overlay (ModalOverlay).
const panelOf = (role: 'dialog' | 'alertdialog' = 'dialog') =>
  screen.getByRole(role).parentElement as HTMLElement;
const overlayOf = (role: 'dialog' | 'alertdialog' = 'dialog') =>
  panelOf(role).parentElement as HTMLElement;

/** Every class is on the element (no jest-dom here, so a tiny helper). */
const has = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => !el?.classList.contains(c))).toEqual([]);
const lacks = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => el?.classList.contains(c))).toEqual([]);

const openDialog = (props: Partial<DialogProps> = {}) =>
  render(
    <Dialog
      open
      onOpenChange={() => undefined}
      title="Edit invoice"
      footer={<button>Save</button>}
      {...props}
    >
      Body
    </Dialog>,
  );

const openAlert = (props: Partial<AlertDialogProps> = {}) =>
  render(
    <AlertDialog
      open
      onOpenChange={() => undefined}
      title="Delete 3 invoices?"
      confirmLabel="Delete invoices"
      onConfirm={() => undefined}
      {...props}
    />,
  );

const openDrawer = (props: Partial<DrawerProps> = {}) =>
  render(
    <Drawer open onOpenChange={() => undefined} title="Filters" {...props}>
      Body
    </Drawer>,
  );

describe('Dialog styles', () => {
  it('defaults: md width, rounded with a border, centered with an edge gap', () => {
    openDialog();
    has(panelOf(), 'max-w-lg', 'rounded-lg', 'border');
    has(overlayOf(), 'items-center', 'p-4');
  });

  it('size="xl" is wider; size="full" fills the screen with no corners or gap', () => {
    const { unmount } = openDialog({ size: 'xl' });
    has(panelOf(), 'max-w-5xl', 'rounded-lg');
    unmount();
    openDialog({ size: 'full' });
    has(panelOf(), 'h-dvh', 'max-w-none');
    lacks(panelOf(), 'rounded-lg');
    lacks(overlayOf(), 'p-4');
  });

  it('placement="top" anchors it near the top instead of the middle', () => {
    openDialog({ placement: 'top' });
    has(overlayOf(), 'items-start');
    lacks(overlayOf(), 'items-center');
  });

  it('divided adds a line under the header and above the footer', () => {
    openDialog({ divided: true });
    const dialog = screen.getByRole('dialog');
    has(dialog.querySelector('header'), 'border-b');
    has(dialog.querySelector('footer'), 'border-t');
  });

  it('is not divided by default', () => {
    openDialog();
    lacks(screen.getByRole('dialog').querySelector('header'), 'border-b');
  });
});

describe('AlertDialog styles', () => {
  it('no icon unless a tone is given', () => {
    openAlert();
    expect(
      screen.getByRole('alertdialog').querySelector('[data-tone]'),
    ).toBeNull();
  });

  it('tone shows a decorative icon; the name is still just the title', () => {
    openAlert({ tone: 'warning' });
    const dialog = screen.getByRole('alertdialog', {
      name: 'Delete 3 invoices?',
    });
    const circle = dialog.querySelector('[data-tone="warning"]');
    has(circle, 'bg-warning-soft');
    expect(circle?.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('layout="center" centers the text but keeps Cancel first in focus and Tab order', () => {
    openAlert({ tone: 'danger', layout: 'center' });
    const dialog = screen.getByRole('alertdialog');
    has(dialog.querySelector('header'), 'text-center');
    const [first, second] = within(dialog).getAllByRole('button');
    expect(first.textContent).toBe('Cancel');
    expect(second.textContent).toBe('Delete invoices');
    expect(document.activeElement).toBe(first);
  });
});

describe('Drawer styles', () => {
  it('defaults: end side, md width, full height', () => {
    openDrawer();
    has(panelOf(), 'h-full', 'max-w-md', 'border-s');
    has(overlayOf(), 'justify-end');
    lacks(overlayOf(), 'flex-col');
  });

  it('size="full" on a side covers the whole width', () => {
    openDrawer({ size: 'full' });
    has(panelOf(), 'w-full');
    lacks(panelOf(), 'max-w-md');
  });

  it('placement="bottom" is a full-width sheet whose size caps its height', () => {
    openDrawer({ placement: 'bottom', size: 'sm' });
    has(panelOf(), 'w-full', 'rounded-t-xl', 'max-h-[40dvh]');
    lacks(panelOf(), 'h-full', 'max-w-sm');
    has(overlayOf(), 'flex-col', 'justify-end');
  });

  it('placement="top" drops down from the top edge', () => {
    openDrawer({ placement: 'top' });
    has(panelOf(), 'rounded-b-xl', 'max-h-[60dvh]');
    has(overlayOf(), 'flex-col', 'justify-start');
  });
});
