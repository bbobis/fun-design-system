import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its text in a span, so the meaning is in the text, not the color', () => {
    render(<Badge tone="danger">Overdue</Badge>);
    const badge = screen.getByText('Overdue');
    expect(badge.tagName).toBe('SPAN');
    // The tone names its colors; the default (soft) variant paints with them.
    expect(badge.className).toContain('--badge-soft:var(--color-danger-soft)');
    expect(badge.className).toContain('bg-(--badge-soft)');
  });

  it('defaults to the neutral tone', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft').className).toContain(
      '--badge-soft:var(--color-surface)',
    );
  });

  it('is not focusable or interactive', () => {
    render(<Badge tone="success">Paid</Badge>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Paid').tabIndex).toBe(-1);
  });

  it('variant picks which of the tone’s colors paint it', () => {
    const { rerender } = render(
      <Badge tone="danger" variant="solid">
        Failed
      </Badge>,
    );
    expect(screen.getByText('Failed').className).toContain(
      'bg-(--badge-solid)',
    );
    rerender(
      <Badge tone="danger" variant="outline">
        Failed
      </Badge>,
    );
    const outline = screen.getByText('Failed');
    expect(outline.className).toContain('border-(--badge-line)');
    expect(outline.className).toContain('bg-transparent');
    // The prediction: outline text uses the soft-text token (made to contrast with the
    // page in both themes), not the strong tone color.
    expect(outline.className).toContain('text-(--badge-on-soft)');
  });

  it('dot and icon are decoration; the name is still just the text', () => {
    render(
      <Badge tone="success" dot icon={<svg data-testid="i" />}>
        Online
      </Badge>,
    );
    const badge = screen.getByText('Online');
    const hidden = badge.querySelectorAll('[aria-hidden="true"]');
    expect(hidden).toHaveLength(2);
    expect(badge.textContent).toBe('Online');
  });

  it('a dot on solid uses the text color, so it stays visible', () => {
    render(
      <Badge tone="danger" variant="solid" dot>
        Failed
      </Badge>,
    );
    expect(
      screen.getByText('Failed').querySelector('[aria-hidden]')?.className,
    ).toContain('bg-current');
  });

  it('size sm and native attributes pass through', () => {
    render(
      <Badge size="sm" title="Status" data-testid="b">
        Draft
      </Badge>,
    );
    const b = screen.getByTestId('b');
    expect(b.className).toContain('px-1.5');
    expect(b.getAttribute('title')).toBe('Status');
  });
});
