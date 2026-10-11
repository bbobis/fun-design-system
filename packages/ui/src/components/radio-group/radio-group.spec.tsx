import { act, fireEvent, render, screen } from '@testing-library/react';
import { Radio, RadioGroup } from './radio-group';

function Terms(props: Partial<Parameters<typeof RadioGroup>[0]>) {
  return (
    <RadioGroup label="Payment terms" name="terms" {...props}>
      <Radio value="net15">Net 15</Radio>
      <Radio value="net30" description="Most customers">
        Net 30
      </Radio>
      <Radio value="receipt" disabled>
        Due on receipt
      </Radio>
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('is a radiogroup named by its label; each radio is named by its text', () => {
    render(<Terms />);
    expect(
      screen.getByRole('radiogroup', { name: 'Payment terms' }),
    ).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /Net 30/ })).toBeTruthy();
  });

  it('↓ moves to the next radio and chooses it; disabled ones are skipped', () => {
    const onChange = vi.fn();
    render(<Terms defaultValue="net15" onChange={onChange} />);
    const first = screen.getByRole('radio', { name: 'Net 15' });
    act(() => first.focus());
    act(() => {
      fireEvent.keyDown(first, { key: 'ArrowDown' });
    });
    expect(onChange).toHaveBeenLastCalledWith('net30');
    const second = screen.getByRole('radio', { name: /Net 30/ });
    act(() => {
      fireEvent.keyDown(second, { key: 'ArrowDown' }); // skips "Due on receipt", wraps
    });
    expect(onChange).toHaveBeenLastCalledWith('net15');
  });

  it('a click chooses; a form posts the value under `name`', () => {
    const { container } = render(
      <form>
        <Terms />
      </form>,
    );
    act(() => fireEvent.click(screen.getByRole('radio', { name: /Net 30/ })));
    const data = new FormData(
      container.querySelector('form') as HTMLFormElement,
    );
    expect(data.get('terms')).toBe('net30');
  });

  it('error: the group is invalid and the message is linked to it', () => {
    render(<Terms error="Choose payment terms" required />);
    const group = screen.getByRole('radiogroup', { name: /Payment terms/ });
    const message = screen.getByText('Choose payment terms');
    expect(group.getAttribute('aria-describedby')).toContain(message.id);
    expect(group.getAttribute('aria-invalid')).toBe('true');
  });

  it('description is linked to the group', () => {
    render(<Terms description="Applies to new invoices." />);
    const group = screen.getByRole('radiogroup');
    const help = screen.getByText('Applies to new invoices.');
    expect(group.getAttribute('aria-describedby')).toContain(help.id);
  });
});
