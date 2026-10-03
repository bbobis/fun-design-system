import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('names the control it points at with htmlFor', () => {
    render(
      <>
        <Label htmlFor="name">Full name</Label>
        <input id="name" />
      </>,
    );
    expect(screen.getByLabelText('Full name').id).toBe('name');
  });

  it('shows a required marker that screen readers skip', () => {
    render(
      <>
        <Label htmlFor="name" required>
          Full name
        </Label>
        <input id="name" />
      </>,
    );
    // getByRole computes the accessible name like a screen reader does, so the
    // aria-hidden "*" is left out. (getByLabelText would see "Full name*".)
    expect(screen.getByRole('textbox', { name: 'Full name' })).toBeTruthy();
    expect(screen.getByText('*').getAttribute('aria-hidden')).toBe('true');
  });
});
