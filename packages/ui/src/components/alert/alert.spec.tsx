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
    // Info tone's colors, painted by the default soft variant.
    expect(box.className).toContain('--alert-soft:var(--color-info-soft)');
    expect(box.className).toContain('bg-(--alert-soft)');
    expect(box.className).toContain('mt-4');
  });

  it('variant: soft (default), outline (page background, tone border + icon), solid', () => {
    const { container, rerender } = render(
      <Alert tone="danger" variant="outline" title="Payment failed" />,
    );
    const box = () => container.firstElementChild as HTMLElement;
    expect(box().className).toContain('bg-bg');
    expect(box().className).toContain('border-(--alert-strong-line)');
    expect(box().querySelector('svg')?.getAttribute('class')).toContain(
      'text-(--alert-icon)',
    );
    rerender(<Alert tone="danger" variant="solid" title="Payment failed" />);
    expect(box().className).toContain('bg-(--alert-solid)');
    expect(box().className).toContain('text-(--alert-on-solid)');
  });

  it('every variant still says its tone in words', () => {
    for (const variant of ['soft', 'outline', 'solid'] as const) {
      const { unmount } = render(
        <Alert tone="warning" variant={variant} title="Data is stale" />,
      );
      expect(screen.getByText('Warning:', { exact: false })).toBeTruthy();
      unmount();
    }
  });

  it('banner: square and full-bleed, but NOT the page banner landmark (the prediction)', () => {
    const { container } = render(
      <Alert banner title="Maintenance tonight" announce />,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('rounded-none');
    expect(box.className).toContain('border-x-0');
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.getByRole('status')).toBe(box);
  });

  it('size sm: one compact line, actions pushed to the end', () => {
    const { container } = render(
      <Alert size="sm" title="3 rows failed" actions={<button>Retry</button>}>
        Check the highlighted rows.
      </Alert>,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('py-2');
    expect(
      screen.getByRole('button', { name: 'Retry' }).parentElement?.className,
    ).toContain('ms-auto');
  });
});
