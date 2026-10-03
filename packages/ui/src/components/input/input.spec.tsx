import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Field } from '../field';
import { Input } from './input';

describe('Input', () => {
  it('renders a native input and reports changes', () => {
    const onChange = vi.fn();
    render(<Input aria-label="Search" onChange={onChange} />);
    const input = screen.getByRole('textbox', {
      name: 'Search',
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'invoices' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('invoices');
  });

  it('marks itself invalid with aria-invalid', () => {
    render(<Input aria-label="Email" invalid />);
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('leaves aria-invalid off when valid (not "false")', () => {
    render(<Input aria-label="Email" />);
    expect(screen.getByRole('textbox').hasAttribute('aria-invalid')).toBe(
      false,
    );
  });

  it('passes native attributes through and exposes the DOM node via ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Input ref={ref} aria-label="Amount" type="number" inputMode="decimal" />,
    );
    expect(ref.current?.type).toBe('number');
    expect(ref.current?.inputMode).toBe('decimal');
  });

  it('lets className override its own classes', () => {
    render(<Input aria-label="Code" className="px-6" />);
    const classes = screen.getByRole('textbox').className.split(' ');
    expect(classes).toContain('px-6');
    expect(classes).not.toContain('px-3');
  });
});

describe('Input inside Field', () => {
  it('is named by the Field label', () => {
    render(
      <Field label="Email">
        <Input type="email" />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
  });

  it('announces the description and error through aria-describedby', () => {
    render(
      <Field
        label="Email"
        description="We never share it."
        error="Enter a valid email."
      >
        <Input type="email" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    // This is how a screen reader user learns about the error: it is read after the
    // label when the input gets focus.
    const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    const texts = ids.map((id) => document.getElementById(id)?.textContent);
    expect(texts).toEqual(['We never share it.', 'Enter a valid email.']);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('passes required and disabled down to the input', () => {
    render(
      <Field label="Email" required disabled>
        <Input type="email" />
      </Field>,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
  });

  it('keeps an app-provided aria-describedby alongside the Field ids', () => {
    render(
      <>
        <p id="extra">Format: name@example.com</p>
        <Field label="Email" error="Required.">
          <Input aria-describedby="extra" />
        </Field>
      </>,
    );
    const ids = screen
      .getByRole('textbox')
      .getAttribute('aria-describedby')
      ?.split(' ');
    expect(ids).toContain('extra');
    expect(ids).toHaveLength(2);
  });

  it('gives each Field its own ids, so two Fields never collide', () => {
    render(
      <>
        <Field label="First name">
          <Input />
        </Field>
        <Field label="Last name">
          <Input />
        </Field>
      </>,
    );
    const first = screen.getByRole('textbox', { name: 'First name' });
    const last = screen.getByRole('textbox', { name: 'Last name' });
    expect(first.id).not.toBe(last.id);
  });
});
