import { render, screen } from '@testing-library/react';
import { TreeView, type TreeNode } from '../tree-view';
import { Accordion, Disclosure, type DisclosureVariant } from './disclosure';

const has = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => !el?.classList.contains(c))).toEqual([]);
const lacks = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => el?.classList.contains(c))).toEqual([]);

/** The section element: the heading's parent (React Aria's Disclosure). */
const section = (name: string) =>
  screen.getByRole('button', { name }).closest('[data-variant]');

function Faq({ variant }: { variant?: DisclosureVariant }) {
  return (
    <Accordion variant={variant} defaultExpandedIds={['a']}>
      <Disclosure id="a" title="Refunds">
        Five days.
      </Disclosure>
      <Disclosure id="b" title="Invoices">
        Under Billing.
      </Disclosure>
    </Accordion>
  );
}

describe('Accordion / Disclosure styles', () => {
  it('bordered by default: the group draws the box and dividers, not the sections', () => {
    render(<Faq />);
    const group = section('Refunds')?.parentElement;
    has(group, 'divide-y', 'border', 'rounded-md');
    lacks(section('Refunds'), 'border');
  });

  it('separated and filled: each section draws its own box, with a gap', () => {
    const { unmount } = render(<Faq variant="separated" />);
    has(section('Refunds'), 'border', 'rounded-md');
    has(section('Refunds')?.parentElement, 'gap-2');
    unmount();
    render(<Faq variant="filled" />);
    has(section('Invoices'), 'bg-surface');
    lacks(section('Invoices'), 'border');
  });

  it('flush: lines only, and no side padding on the title', () => {
    render(<Faq variant="flush" />);
    has(section('Refunds')?.parentElement, 'divide-y', 'border-y');
    has(screen.getByRole('button', { name: 'Refunds' }), 'px-0');
  });

  it('a Disclosure on its own takes its own variant and size', () => {
    render(
      <Disclosure title="Details" variant="filled" size="lg">
        x
      </Disclosure>,
    );
    has(section('Details'), 'bg-surface');
    has(screen.getByRole('button', { name: 'Details' }), 'text-base', 'py-4');
  });

  it('size and chevronPosition flow from the Accordion; heading, name and state unchanged', () => {
    render(
      <Accordion size="sm" chevronPosition="start" defaultExpandedIds={['a']}>
        <Disclosure id="a" title="Refunds" headingLevel={2}>
          Five days.
        </Disclosure>
      </Accordion>,
    );
    const trigger = screen.getByRole('button', { name: 'Refunds' });
    has(trigger, 'text-sm', 'py-2', 'justify-start');
    // The arrow comes first in the button, before the title text.
    expect(trigger.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Refunds' }),
    ).toBeTruthy();
    // The content lines up with the title.
    has(screen.getByText('Five days.'), 'ps-[2.125rem]');
  });
});

const nodes: TreeNode[] = [
  {
    id: 'billing',
    label: 'Billing',
    children: [
      {
        id: 'invoices',
        label: 'Invoices',
        children: [{ id: 'inv-1', label: 'INV-1.pdf' }],
      },
    ],
  },
];
const row = (name: string) =>
  screen.getByRole('row', { name: new RegExp(`^${name}`) });

describe('TreeView styles', () => {
  it('md by default, no guides', () => {
    render(<TreeView aria-label="Files" nodes={nodes} />);
    has(screen.getByRole('treegrid'), 'text-sm', 'gap-px');
    has(row('Billing'), 'py-1.5');
    expect(row('Billing').className).not.toContain('before:');
  });

  it('size="sm": smaller text, rows and indent', () => {
    render(<TreeView aria-label="Files" nodes={nodes} size="sm" />);
    has(screen.getByRole('treegrid'), 'text-xs', '[--tree-indent:1rem]');
    has(row('Billing'), 'py-1');
  });

  it('guides are CSS on each row; depth for screen readers is still aria-level', () => {
    render(
      <TreeView
        aria-label="Files"
        nodes={nodes}
        guides
        defaultExpanded={['billing', 'invoices']}
      />,
    );
    // No gap between rows, or the lines would break.
    lacks(screen.getByRole('treegrid'), 'gap-px');
    const deep = row('INV-1.pdf');
    expect(deep.className).toContain(
      'before:w-[calc((var(--tree-item-level)-1)*var(--tree-indent))]',
    );
    expect(deep.getAttribute('aria-level')).toBe('3');
    // No extra elements: the guides add nothing to the accessibility tree.
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });
});
