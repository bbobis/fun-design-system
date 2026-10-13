import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CheckboxCard,
  CheckboxGroup,
  CheckboxGroupItem,
} from './checkbox-group';

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
    // Named by the label only; the description is read after it, not as part of it.
    const rep = screen.getByRole('checkbox', { name: 'Sales rep' });
    const help = screen.getByText("The account's sales rep");
    expect(rep.getAttribute('aria-describedby')).toContain(help.id);
  });

  it('reports the full list of checked values', () => {
    const onChange = vi.fn();
    render(<Copies defaultValue={['customer']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Sales rep/ }));
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

describe('CheckboxCard', () => {
  function AddOns(props: Partial<Parameters<typeof CheckboxGroup>[0]>) {
    return (
      <CheckboxGroup label="Add-ons" orientation="horizontal" {...props}>
        <CheckboxCard value="sso" title="SSO" description="Okta, Azure AD">
          $5 / user
        </CheckboxCard>
        <CheckboxCard value="audit" title="Audit log">
          $2 / user
        </CheckboxCard>
        <CheckboxCard value="api" title="API access" disabled>
          $3 / user
        </CheckboxCard>
      </CheckboxGroup>
    );
  }

  it('each card is a checkbox named by its title only, and described by its description', () => {
    render(<AddOns />);
    const sso = screen.getByRole('checkbox', { name: 'SSO' });
    const described = (sso.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
      .join(' ');
    expect(described).toContain('Okta, Azure AD');
    expect(described).not.toContain('$5');
    // No description: nothing of its own to describe it with.
    expect(screen.getByRole('checkbox', { name: 'Audit log' })).toBeTruthy();
  });

  it('clicking anywhere on a card toggles it; onChange gets every checked value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AddOns defaultValue={['sso']} onChange={onChange} />);
    // The price text, not the checkbox: user.click plays the whole pointer sequence,
    // and the <label> passes it on to the input, as in a browser. (fireEvent.click
    // alone didn't reach React Aria's Checkbox.)
    await user.click(screen.getByText('$2 / user'));
    expect(onChange).toHaveBeenLastCalledWith(['sso', 'audit']);
    await user.click(screen.getByText('$5 / user'));
    expect(onChange).toHaveBeenLastCalledWith(['audit']);
  });

  it('each card is its own Tab stop; arrows do nothing; disabled ones are skipped', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <AddOns onChange={onChange} />
        <button>After</button>
      </>,
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('checkbox', { name: 'SSO' }),
    );
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(
      screen.getByRole('checkbox', { name: 'SSO' }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('checkbox', { name: 'Audit log' }),
    );
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['audit']);
    await user.tab(); // API access is disabled
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'After' }),
    );
  });

  it('the row knows its orientation, so cards can share it', () => {
    render(<AddOns />);
    const row = screen
      .getByRole('checkbox', { name: 'SSO' })
      .closest('[data-orientation]');
    expect(row?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('shares the group error', () => {
    render(<AddOns required error="Choose at least one." />);
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box.getAttribute('aria-invalid')).toBe('true');
    }
    expect(screen.getByText('Choose at least one.')).toBeTruthy();
  });
});
