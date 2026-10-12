import { act, fireEvent, render, screen } from '@testing-library/react';
import { Field } from '../field';
import { SearchField } from './search-field';

const box = () => screen.getByRole('searchbox');
const key = (k: string) =>
  act(() => {
    fireEvent.keyDown(box(), { key: k });
    fireEvent.keyUp(box(), { key: k });
  });

describe('SearchField', () => {
  it('is a searchbox (type="search") named by aria-label', () => {
    render(<SearchField aria-label="Search invoices" />);
    expect(box().getAttribute('type')).toBe('search');
    expect(
      screen.getByRole('searchbox', { name: 'Search invoices' }),
    ).toBeTruthy();
  });

  it('typing calls onChange; Enter calls onSubmit with the text', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(
      <SearchField
        aria-label="Search"
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(box(), { target: { value: 'acme' } });
    expect(onChange).toHaveBeenLastCalledWith('acme');
    key('Enter');
    expect(onSubmit).toHaveBeenCalledWith('acme');
  });

  it('Escape clears the text and calls onClear', () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    render(
      <SearchField
        aria-label="Search"
        defaultValue="acme"
        onClear={onClear}
        onChange={onChange}
      />,
    );
    act(() => box().focus());
    key('Escape');
    expect((box() as HTMLInputElement).value).toBe('');
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('Escape on an empty field is left alone, so a Dialog around it can close', () => {
    const outer = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div onKeyDown={(e) => e.key === 'Escape' && outer()}>
        <SearchField aria-label="Search" />
      </div>,
    );
    act(() => box().focus());
    key('Escape');
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it('the ✕ is named "Clear search", clears, and is not a Tab stop', () => {
    const onClear = vi.fn();
    render(
      <SearchField aria-label="Search" defaultValue="acme" onClear={onClear} />,
    );
    const clear = screen.getByRole('button', { name: 'Clear search' });
    expect(clear.getAttribute('tabindex')).toBe('-1');
    fireEvent.click(clear);
    expect((box() as HTMLInputElement).value).toBe('');
    expect(onClear).toHaveBeenCalled();
  });

  it('inside a Field: named by the label, linked to the error, marked invalid', () => {
    render(
      <Field label="Invoice number" error="Use the format INV-1234">
        <SearchField />
      </Field>,
    );
    const input = screen.getByRole('searchbox', { name: 'Invoice number' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const described = (input.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
      .join(' ');
    expect(described).toContain('Use the format INV-1234');
  });

  it('posts its text with a form under `name`', () => {
    const { container } = render(
      <form>
        <SearchField aria-label="Search" name="q" defaultValue="acme" />
      </form>,
    );
    expect(
      new FormData(container.querySelector('form') as HTMLFormElement).get('q'),
    ).toBe('acme');
  });
});
