import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Accordion, Disclosure } from './disclosure';

const trigger = (name: string) => screen.getByRole('button', { name });
const expanded = () =>
  screen
    .getAllByRole('button')
    .map((b) => `${b.textContent}:${b.getAttribute('aria-expanded')}`);

function Faq(props: Partial<Parameters<typeof Accordion>[0]>) {
  return (
    <Accordion {...props}>
      <Disclosure id="a" title="First">
        One
      </Disclosure>
      <Disclosure id="b" title="Second">
        Two
      </Disclosure>
      <Disclosure id="c" title="Third" disabled>
        Three
      </Disclosure>
    </Accordion>
  );
}

describe('Disclosure', () => {
  it('the title is a heading (level 3 by default) holding a button with aria-expanded', () => {
    render(<Disclosure title="Advanced settings">Hidden stuff</Disclosure>);
    const heading = screen.getByRole('heading', {
      level: 3,
      name: 'Advanced settings',
    });
    const button = trigger('Advanced settings');
    expect(heading.contains(button)).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    // The panel is linked to its button and hidden "until found" (Ctrl+F still finds it).
    const panel = document.getElementById(
      button.getAttribute('aria-controls') ?? '',
    );
    expect(panel?.getAttribute('hidden')).toBe('until-found');
  });

  it('a click (or Enter/Space, a native button) toggles it and reports the state', () => {
    const onExpandedChange = vi.fn();
    render(
      <Disclosure title="Details" onExpandedChange={onExpandedChange}>
        Body
      </Disclosure>,
    );
    fireEvent.click(trigger('Details'));
    expect(trigger('Details').getAttribute('aria-expanded')).toBe('true');
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('headingLevel sets the heading tag', () => {
    render(
      <Disclosure title="Details" headingLevel={2}>
        Body
      </Disclosure>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Details' }),
    ).toBeTruthy();
  });

  it('controlled: follows `expanded`', () => {
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Disclosure
            title="Details"
            expanded={open}
            onExpandedChange={setOpen}
          >
            Body
          </Disclosure>
          <button type="button" onClick={() => setOpen(false)}>
            close
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(trigger('Details').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByText('close'));
    expect(trigger('Details').getAttribute('aria-expanded')).toBe('false');
  });
});

describe('Accordion', () => {
  it('one open at a time by default: opening one closes the other', () => {
    const onExpandedChange = vi.fn();
    render(
      <Faq defaultExpandedIds={['a']} onExpandedChange={onExpandedChange} />,
    );
    expect(expanded()).toEqual(['First:true', 'Second:false', 'Third:false']);
    fireEvent.click(trigger('Second'));
    expect(expanded()).toEqual(['First:false', 'Second:true', 'Third:false']);
    expect(onExpandedChange).toHaveBeenLastCalledWith(['b']);
  });

  it('allowsMultiple keeps the others open', () => {
    render(<Faq allowsMultiple defaultExpandedIds={['a']} />);
    fireEvent.click(trigger('Second'));
    expect(expanded()).toEqual(['First:true', 'Second:true', 'Third:false']);
  });

  it('a disabled section cannot be opened', () => {
    render(<Faq />);
    expect(trigger('Third').hasAttribute('disabled')).toBe(true);
    fireEvent.click(trigger('Third'));
    expect(trigger('Third').getAttribute('aria-expanded')).toBe('false');
  });

  it('every title is its own heading (page structure, not one widget)', () => {
    render(<Faq />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });
});
