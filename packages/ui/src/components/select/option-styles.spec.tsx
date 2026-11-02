import { act, fireEvent, render, screen } from '@testing-library/react';
import { Combobox } from '../combobox';
import { Select, type SelectOption } from './select';

const has = (el: Element, ...classes: string[]) =>
  classes.forEach((c) => expect(el.classList.contains(c)).toBe(true));
const lacks = (el: Element, ...classes: string[]) =>
  classes.forEach((c) => expect(el.classList.contains(c)).toBe(false));

const press = (el: Element, key: string) =>
  act(() => {
    fireEvent.keyDown(el, { key });
    fireEvent.keyUp(el, { key });
  });
const openSelect = () => press(screen.getByRole('button'), 'ArrowDown');
const option = (name: string | RegExp) => screen.getByRole('option', { name });

const roles: SelectOption[] = [
  { value: 'viewer', label: 'Viewer', description: 'Can see invoices' },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can change billing',
    icon: <svg data-testid="admin-icon" />,
  },
];
const plain: SelectOption[] = [
  { value: 'draft', label: 'Draft', icon: <svg data-testid="draft-icon" /> },
  { value: 'paid', label: 'Paid' },
];

describe('option description and icon', () => {
  it('the description is the option’s accessible description, not part of its name', () => {
    render(<Select aria-label="Role" options={roles} />);
    openSelect();
    const admin = option('Admin');
    const describedBy = admin.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe(
      'Can change billing',
    );
  });

  it('the icon is hidden from screen readers', () => {
    render(<Select aria-label="Role" options={roles} />);
    openSelect();
    const icon = screen.getByTestId('admin-icon');
    expect(icon.parentElement?.getAttribute('aria-hidden')).toBe('true');
  });

  it('the closed Select shows the chosen label and icon, never the description', () => {
    render(<Select aria-label="Role" options={roles} defaultValue="admin" />);
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Admin');
    expect(button.textContent).not.toContain('Can change billing');
    expect(screen.getByTestId('admin-icon')).toBeTruthy();
  });

  it('startIcon wins over the chosen option’s icon', () => {
    render(
      <Select
        aria-label="Status"
        options={plain}
        defaultValue="draft"
        startIcon={<svg data-testid="start" />}
      />,
    );
    expect(screen.getByTestId('start')).toBeTruthy();
    expect(screen.queryByTestId('draft-icon')).toBeNull();
  });
});

describe('the list matches the field size', () => {
  it.each([
    ['sm', 'h-7'],
    ['md', 'h-8'],
    ['lg', 'h-10'],
  ] as const)('Select size=%s → rows %s', (size, cls) => {
    render(<Select aria-label="Status" options={plain} size={size} />);
    openSelect();
    has(option('Draft'), cls);
  });

  it('rows with descriptions are taller', () => {
    render(<Select aria-label="Role" options={roles} size="lg" />);
    openSelect();
    has(option('Admin'), 'h-14', 'text-base');
    lacks(option('Admin'), 'h-10');
  });

  it('Combobox passes its size and descriptions to the list', () => {
    render(<Combobox aria-label="Role" options={roles} size="sm" />);
    const input = screen.getByRole('combobox');
    act(() => input.focus());
    press(input, 'ArrowDown');
    has(option('Admin'), 'h-11');
    expect(
      document.getElementById(
        option('Admin').getAttribute('aria-describedby') ?? '',
      )?.textContent,
    ).toBe('Can change billing');
  });
});
