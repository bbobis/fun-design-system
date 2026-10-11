import { act, fireEvent, render, screen } from '@testing-library/react';
import { Field } from '../field';
import { TextArea } from './textarea';

describe('TextArea', () => {
  it('is named by the Field label and marked invalid from the Field error', () => {
    render(
      <Field label="Notes" error="Too short">
        <TextArea />
      </Field>,
    );
    const box = screen.getByRole('textbox', { name: 'Notes' });
    expect(box.tagName).toBe('TEXTAREA');
    expect(box.getAttribute('aria-invalid')).toBe('true');
  });

  it('showCount: counts as you type and is read with the field (aria-describedby)', () => {
    render(
      <Field label="Notes">
        <TextArea maxLength={20} showCount />
      </Field>,
    );
    const box = screen.getByRole('textbox', { name: 'Notes' });
    expect(screen.getByText('0 / 20', { exact: false })).toBeTruthy();
    act(() => {
      fireEvent.change(box, { target: { value: 'Call back Monday' } });
    });
    const count = screen.getByText('16 / 20', { exact: false });
    expect(box.getAttribute('aria-describedby')).toContain(count.id);
  });

  it('no count without maxLength', () => {
    render(<TextArea aria-label="Notes" showCount />);
    expect(screen.queryByText('/', { exact: false })).toBeNull();
  });

  it('passes native attributes and className through', () => {
    render(
      <TextArea
        aria-label="Notes"
        placeholder="Anything else?"
        className="mt-2"
      />,
    );
    const box = screen.getByRole('textbox', { name: 'Notes' });
    expect(box.getAttribute('placeholder')).toBe('Anything else?');
    expect(box.className).toContain('mt-2');
  });
});
