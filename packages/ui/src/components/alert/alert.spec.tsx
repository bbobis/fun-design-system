import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../button';
import { Alert } from './alert';

describe('Alert', () => {
  it('says its tone in words, not only with color and icon', () => {
    render(<Alert tone="warning" title="Exchange rates are 2 days old" />);
    // Screen readers hear "Warning: Exchange rates are 2 days old".
    expect(screen.getByText('Exchange rates are 2 days old').textContent).toBe(
      'Warning: Exchange rates are 2 days old',
    );
  });

  it('still says its tone without a title', () => {
    render(<Alert tone="danger">Could not reach the server.</Alert>);
    expect(screen.getByText('Error:', { exact: false })).toBeTruthy();
  });

  it('is not a live region unless asked: alerts present on load just read in order', () => {
    render(<Alert tone="danger" title="Payment failed" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('announce: danger/warning interrupt (alert), info/success wait (status)', () => {
    const { rerender } = render(
      <Alert tone="danger" title="Payment failed" announce />,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    rerender(<Alert tone="success" title="Saved" announce />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows actions and a dismiss button only when given', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Alert title="Draft saved" />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(
      <Alert
        title="Draft saved"
        onDismiss={onDismiss}
        actions={<Button size="sm">Open draft</Button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Open draft' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('defaults to the info tone and accepts a className', () => {
    const { container } = render(<Alert title="Tip" className="mt-4" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('bg-info-soft');
    expect(box.className).toContain('mt-4');
  });
});
