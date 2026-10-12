import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../button';
import { Toolbar } from '../toolbar';
import { ToggleGroup, type ToggleOption } from './toggle-group';

const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key });
    fireEvent.keyUp(document.activeElement as Element, { key });
  });
const button = (name: string) => screen.getByRole('button', { name });
const pressed = (name: string) => button(name).getAttribute('aria-pressed');

const statuses: ToggleOption[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'paid', label: 'Paid' },
];

describe('ToggleGroup', () => {
  it('standalone: a named toolbar of buttons with aria-pressed', () => {
    render(
      <ToggleGroup
        aria-label="Show"
        options={statuses}
        defaultValue={['sent']}
      />,
    );
    expect(screen.getByRole('toolbar', { name: 'Show' })).toBeTruthy();
    expect(pressed('Draft')).toBe('false');
    expect(pressed('Sent')).toBe('true');
    expect(pressed('Paid')).toBe('false');
  });

  it('click toggles; onChange gets ids in option order, and can be empty', () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup
        aria-label="Show"
        options={statuses}
        defaultValue={['paid']}
        onChange={onChange}
      />,
    );
    fireEvent.click(button('Draft'));
    expect(onChange).toHaveBeenLastCalledWith(['draft', 'paid']);
    fireEvent.click(button('Draft'));
    fireEvent.click(button('Paid'));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(pressed('Paid')).toBe('false');
  });

  it('keyboard: ←/→ move, Space toggles', () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup aria-label="Show" options={statuses} onChange={onChange} />,
    );
    act(() => button('Draft').focus());
    press('ArrowRight');
    expect(document.activeElement).toBe(button('Sent'));
    press(' ');
    expect(onChange).toHaveBeenLastCalledWith(['sent']);
    expect(pressed('Sent')).toBe('true');
  });

  it('controlled: follows value, not clicks', () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup
        aria-label="Show"
        options={statuses}
        value={['draft']}
        onChange={onChange}
      />,
    );
    fireEvent.click(button('Sent'));
    expect(onChange).toHaveBeenLastCalledWith(['draft', 'sent']);
    expect(pressed('Sent')).toBe('false');
  });

  it('iconOnly: buttons are still named by their label', () => {
    render(
      <ToggleGroup
        aria-label="Text style"
        iconOnly
        options={[{ id: 'bold', label: 'Bold', icon: <span>B</span> }]}
      />,
    );
    expect(button('Bold')).toBeTruthy();
  });

  it('disabled: the group and single options', () => {
    const { unmount } = render(
      <ToggleGroup aria-label="Show" options={statuses} disabled />,
    );
    expect(button('Draft')).toHaveProperty('disabled', true);
    unmount();
    render(
      <ToggleGroup
        aria-label="Show"
        options={[...statuses, { id: 'void', label: 'Void', disabled: true }]}
      />,
    );
    expect(button('Void')).toHaveProperty('disabled', true);
    expect(button('Draft')).toHaveProperty('disabled', false);
  });

  it('inside a Toolbar: becomes a group, and the outer arrows reach it', () => {
    render(
      <Toolbar aria-label="Editor">
        <Button>Undo</Button>
        <ToggleGroup aria-label="Show" options={statuses} />
      </Toolbar>,
    );
    expect(screen.getAllByRole('toolbar')).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'Show' })).toBeTruthy();
    act(() => button('Undo').focus());
    press('ArrowRight');
    expect(document.activeElement).toBe(button('Draft'));
    press('ArrowRight');
    expect(document.activeElement).toBe(button('Sent'));
  });
});
