import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its text in a span, so the meaning is in the text, not the color', () => {
    render(<Badge tone="danger">Overdue</Badge>);
    const badge = screen.getByText('Overdue');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toContain('bg-danger-soft');
  });

  it('defaults to the neutral tone', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft').className).toContain('bg-surface');
  });

  it('is not focusable or interactive', () => {
    render(<Badge tone="success">Paid</Badge>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Paid').tabIndex).toBe(-1);
  });
});
