import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('is a real checkbox: named, toggles, reports changes', () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Accept terms" onChange={onChange} />);
    const box = screen.getByRole('checkbox', {
      name: 'Accept terms',
    }) as HTMLInputElement;
    fireEvent.click(box);
    expect(box.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('gets its name from a wrapping label', () => {
    render(
      <label>
        <Checkbox /> Email me receipts
      </label>,
    );
    expect(
      screen.getByRole('checkbox', { name: 'Email me receipts' }),
    ).toBeTruthy();
  });

  it('sets the indeterminate DOM property (announced as "mixed")', () => {
    const { rerender } = render(<Checkbox aria-label="All" indeterminate />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    rerender(<Checkbox aria-label="All" />);
    expect(box.indeterminate).toBe(false);
  });

  it('passes ref to the input and className to the wrapper', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox aria-label="x" ref={ref} className="ms-2" />);
    expect(ref.current?.type).toBe('checkbox');
    expect(ref.current?.parentElement?.className).toContain('ms-2');
  });

  it('respects disabled', () => {
    render(<Checkbox aria-label="x" disabled />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
