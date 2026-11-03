import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { InlineEdit, type InlineEditProps } from './inline-edit';

function Title(props: Partial<InlineEditProps>) {
  const [value, setValue] = useState('Q4 retainer');
  return (
    <>
      <InlineEdit
        label="Invoice title"
        value={value}
        onSave={(next) => setValue(next)}
        {...props}
      />
      <button type="button">Elsewhere</button>
    </>
  );
}

const editButton = () =>
  screen.getByRole('button', { name: /edit Invoice title$/ });
const input = () =>
  screen.getByRole('textbox', { name: 'Invoice title' }) as HTMLInputElement;

describe('InlineEdit', () => {
  it('reading mode: a button named "<value>, edit <label>" (visible text first)', () => {
    render(<Title />);
    expect(editButton().textContent).toBe('Q4 retainer, edit Invoice title');
  });

  it('Enter opens it with the text selected; typing and Enter saves; focus returns', async () => {
    const user = userEvent.setup();
    render(<Title />);
    act(() => editButton().focus());
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(input());
    expect(input().selectionStart).toBe(0);
    expect(input().selectionEnd).toBe('Q4 retainer'.length);
    await user.keyboard('Q4 retainer (final){Enter}');
    expect(editButton().textContent).toMatch(/^Q4 retainer \(final\)/);
    expect(document.activeElement).toBe(editButton());
  });

  it('Escape cancels: old value back, focus on the button, and Escape stops here', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <div onKeyDown={(e) => e.key === 'Escape' && outer()} role="presentation">
        <Title />
      </div>,
    );
    await user.click(editButton());
    await user.keyboard('Something else{Escape}');
    expect(editButton().textContent).toMatch(/^Q4 retainer,/);
    expect(document.activeElement).toBe(editButton());
    expect(outer).not.toHaveBeenCalled();
  });

  it('the prediction: clicking Cancel cancels (blur does not save first)', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Title onSave={onSave} />);
    await user.click(editButton());
    await user.keyboard('Changed');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(editButton().textContent).toMatch(/^Q4 retainer,/);
  });

  it('even when the browser reports blur to the Cancel button (relatedTarget)', () => {
    const onSave = vi.fn();
    render(<Title onSave={onSave} />);
    fireEvent.click(editButton());
    fireEvent.change(input(), { target: { value: 'Changed' } });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.focusOut(input(), { relatedTarget: cancel });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('clicking elsewhere saves by default, without pulling focus back', async () => {
    const user = userEvent.setup();
    render(<Title />);
    await user.click(editButton());
    await user.keyboard('{Control>}a{/Control}New title');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(editButton().textContent).toMatch(/^New title,/);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Elsewhere' }),
    );
  });

  it('blurBehavior="cancel": clicking elsewhere throws the change away', async () => {
    const user = userEvent.setup();
    render(<Title blurBehavior="cancel" />);
    await user.click(editButton());
    await user.keyboard('{Control>}a{/Control}New title');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(editButton().textContent).toMatch(/^Q4 retainer,/);
  });

  it('validate: shows the error on the input and stays in editing', async () => {
    const user = userEvent.setup();
    render(<Title validate={(v) => (v ? undefined : 'Enter a title.')} />);
    await user.click(editButton());
    await user.clear(input());
    await user.keyboard('{Enter}');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    const errorId = input().getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(errorId)?.textContent).toBe(
      'Enter a title.',
    );
  });

  it('a failing async save shows its message and keeps the typed text', async () => {
    const user = userEvent.setup();
    render(
      <Title
        onSave={() => Promise.reject(new Error('The server didn’t respond.'))}
      />,
    );
    await user.click(editButton());
    await user.keyboard('{Control>}a{/Control}New title{Enter}');
    expect(await screen.findByText('The server didn’t respond.')).toBeTruthy();
    expect(input().value).toBe('New title');
  });

  it('while an async save runs: busy, read-only, buttons disabled', async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    render(
      <Title
        onSave={() =>
          new Promise<void>((resolve) => {
            finish = resolve;
          })
        }
      />,
    );
    await user.click(editButton());
    await user.keyboard('{Control>}a{/Control}New{Enter}');
    expect(input().getAttribute('aria-busy')).toBe('true');
    expect(input().readOnly).toBe(true);
    // The same <input> element the whole time (no remount), so focus stays put.
    expect(document.activeElement).toBe(input());
    expect(
      (screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await act(async () => {
      finish();
      await Promise.resolve();
    });
  });

  it('empty value shows the placeholder; disabled is plain text', () => {
    const { rerender } = render(
      <InlineEdit
        label="PO number"
        value=""
        onSave={() => undefined}
        placeholder="Add a PO number"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Add a PO number, edit PO number' }),
    ).toBeTruthy();
    rerender(
      <InlineEdit
        label="PO number"
        value="PO-77"
        onSave={() => undefined}
        disabled
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('PO-77')).toBeTruthy();
  });
});

describe('InlineEdit inside a heading', () => {
  it('editing mode uses only phrasing elements (no div or p inside the <h1>)', async () => {
    const user = userEvent.setup();
    render(
      <h1>
        <InlineEdit
          label="Invoice title"
          value="Q4"
          onSave={() => undefined}
          validate={() => 'Enter a title.'}
        />
      </h1>,
    );
    await user.click(
      screen.getByRole('button', { name: /edit Invoice title/ }),
    );
    await user.keyboard('x{Enter}');
    const h1 = screen.getByRole('heading');
    expect(h1.querySelector('div, p')).toBeNull();
  });
});
