import { act, fireEvent, render, screen } from '@testing-library/react';
import { Switch } from './switch';

describe('Switch', () => {
  it('is a switch named by its label, off by default', () => {
    render(<Switch>Email me when an invoice is paid</Switch>);
    const sw = screen.getByRole('switch', {
      name: 'Email me when an invoice is paid',
    }) as HTMLInputElement;
    expect(sw.checked).toBe(false);
  });

  it('a click toggles it and reports the new state', () => {
    const onChange = vi.fn();
    render(<Switch onChange={onChange}>Dark mode</Switch>);
    const sw = screen.getByRole('switch', {
      name: 'Dark mode',
    }) as HTMLInputElement;
    act(() => fireEvent.click(sw));
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(sw.checked).toBe(true);
  });

  it('controlled: follows `checked`', () => {
    const { rerender } = render(<Switch checked={false}>Sync</Switch>);
    rerender(<Switch checked>Sync</Switch>);
    expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true);
  });

  it('disabled: the native input is disabled (browsers then block clicks and Tab)', () => {
    // Not tested by clicking: jsdom's fireEvent dispatches events even on disabled
    // inputs, which no real browser does.
    render(<Switch disabled>Sync</Switch>);
    expect((screen.getByRole('switch') as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
