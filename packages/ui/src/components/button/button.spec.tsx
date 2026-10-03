import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type FormEvent } from 'react';
import { Button } from './button';

describe('Button', () => {
  it('renders a native button with its label', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
  });

  it('defaults to type="button", so it does not submit a surrounding form', () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Save</Button>
      </form>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the form when type="submit" is set on purpose', () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when enabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks and sets the native disabled attribute when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button.disabled).toBe(true);
  });

  it('while loading: blocks clicks, announces busy, but stays focusable', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.disabled).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('applies the variant classes and lets className override them', () => {
    render(
      <Button intent="danger" size="sm" className="px-8">
        Delete
      </Button>,
    );
    const classes = screen.getByRole('button').className.split(' ');
    expect(classes).toContain('bg-danger');
    expect(classes).toContain('h-8');
    expect(classes).toContain('px-8'); // from className
    expect(classes).not.toContain('px-3'); // sm's padding, replaced by twMerge
  });

  it('passes native attributes through and exposes the DOM node via ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} aria-label="Close dialog" data-testid="close">
        ×
      </Button>,
    );
    expect(screen.getByTestId('close').getAttribute('aria-label')).toBe(
      'Close dialog',
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
