import { act, fireEvent, render, screen } from '@testing-library/react';
import { CheckboxGroup, CheckboxGroupItem } from './checkbox-group';

function Copies(props: Partial<Parameters<typeof CheckboxGroup>[0]>) {
  return (
    <CheckboxGroup label="Send copies to" name="copies" {...props}>
      <CheckboxGroupItem value="customer">Customer</CheckboxGroupItem>
      <CheckboxGroupItem value="rep" description="The account's sales rep">
        Sales rep
      </CheckboxGroupItem>
      <CheckboxGroupItem value="finance" disabled>
        Finance
      </CheckboxGroupItem>
    </CheckboxGroup>
  );
}

describe('CheckboxGroup', () => {
  it('is a group named by its label; each box is a checkbox named by its text', () => {
    render(<Copies />);
    expect(screen.getByRole('group', { name: 'Send copies to' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByRole('checkbox', { name: /Sales rep/ })).toBeTruthy();
  });

  it('reports the full list of checked values', () => {
    const onChange = vi.fn();
    render(<Copies defaultValue={['customer']} onChange={onChange} />);
    act(() =>
      fireEvent.click(screen.getByRole('checkbox', { name: /Sales rep/ })),
    );
    expect(onChange).toHaveBeenLastCalledWith(['customer', 'rep']);
  });

  it('a form posts one entry per checked value', () => {
    const { container } = render(
      <form>
        <Copies defaultValue={['customer', 'rep']} />
      </form>,
    );
    const data = new FormData(
      container.querySelector('form') as HTMLFormElement,
    );
    expect(data.getAll('copies')).toEqual(['customer', 'rep']);
  });

  it('error and description are linked to the group', () => {
    render(
      <Copies description="At least one." error="Choose who gets a copy" />,
    );
    const group = screen.getByRole('group', { name: 'Send copies to' });
    const ids = group.getAttribute('aria-describedby') ?? '';
    expect(ids).toContain(screen.getByText('At least one.').id);
    expect(ids).toContain(screen.getByText('Choose who gets a copy').id);
  });

  it('required without an error: React Aria never marks it invalid or adds its own message', () => {
    // Raw React Aria flags an empty required group on submit, with a default message.
    // We pass isInvalid={Boolean(error)} so the app owns that message (recipe rule 24).
    const { container } = render(
      <form onSubmit={(e) => e.preventDefault()}>
        <CheckboxGroup label="Notify me" required>
          <CheckboxGroupItem value="email">Email</CheckboxGroupItem>
        </CheckboxGroup>
      </form>,
    );
    act(() => {
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    });
    const group = screen.getByRole('group', { name: /Notify me/ });
    expect(group.hasAttribute('data-invalid')).toBe(false);
    expect(group.getAttribute('aria-describedby')).toBeNull();
  });

  it('each box is its own Tab stop (unlike radios)', () => {
    render(<Copies />);
    const enabled = screen
      .getAllByRole('checkbox')
      .filter((c) => !(c as HTMLInputElement).disabled);
    enabled.forEach((c) => expect(c.tabIndex).toBe(0));
  });
});
