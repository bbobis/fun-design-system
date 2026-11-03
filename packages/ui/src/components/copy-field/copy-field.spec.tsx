import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from '../field';
import { CopyField } from './copy-field';

const KEY = 'sk_live_51Hx9Abc';

function ApiKey() {
  return (
    <Field label="API key">
      <CopyField value={KEY} secret />
    </Field>
  );
}

describe('CopyField', () => {
  it('a read-only input named by the Field', () => {
    render(
      <Field label="Share link">
        <CopyField value="https://acme.example/i/1044" />
      </Field>,
    );
    const input = screen.getByRole('textbox', {
      name: 'Share link',
    }) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(input.value).toBe('https://acme.example/i/1044');
  });

  it('buttons are named from the Field label: "Copy API key", "Show API key"', () => {
    render(<ApiKey />);
    expect(screen.getByRole('button', { name: 'Copy API key' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show API key' })).toBeTruthy();
  });

  it('outside a Field, aria-label names the input and the buttons', () => {
    render(<CopyField value="abc" aria-label="Webhook secret" secret />);
    expect(screen.getByLabelText('Webhook secret')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Copy Webhook secret' }),
    ).toBeTruthy();
  });

  it('secret: dots until Show (aria-pressed), then the text', async () => {
    const user = userEvent.setup();
    const { container } = render(<ApiKey />);
    const input = () => container.querySelector('input') as HTMLInputElement;
    const show = screen.getByRole('button', { name: 'Show API key' });
    expect(input().type).toBe('password');
    expect(show.getAttribute('aria-pressed')).toBe('false');
    await user.click(show);
    expect(input().type).toBe('text');
    expect(show.getAttribute('aria-pressed')).toBe('true');
    // Same name either way: the pressed state carries the change.
    expect(screen.getByRole('button', { name: 'Show API key' })).toBe(show);
  });

  it('copy copies the real value without revealing it, and says "Copied"', async () => {
    const user = userEvent.setup();
    const { container } = render(<ApiKey />);
    await user.click(screen.getByRole('button', { name: 'Copy API key' }));
    expect(await navigator.clipboard.readText()).toBe(KEY);
    expect(screen.getByRole('status').textContent).toBe('Copied');
    expect((container.querySelector('input') as HTMLInputElement).type).toBe(
      'password',
    );
  });

  it('a failing clipboard is announced', async () => {
    const user = userEvent.setup();
    const spy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('denied'));
    render(<ApiKey />);
    await user.click(screen.getByRole('button', { name: 'Copy API key' }));
    expect(screen.getByRole('status').textContent).toMatch(/Couldn’t copy/);
    spy.mockRestore();
  });

  it('focusing the input selects the whole value', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Share link">
        <CopyField value="https://acme.example/i/1044" />
      </Field>,
    );
    await user.tab();
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  it('keeps password managers away (autocomplete off)', () => {
    const { container } = render(<ApiKey />);
    expect(container.querySelector('input')?.getAttribute('autocomplete')).toBe(
      'off',
    );
  });
});
