import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { must } from '../../utils/must';
import { DescriptionItem, DescriptionList } from './description-list';

function Details() {
  return (
    <DescriptionList divided>
      <DescriptionItem label="Invoice number" copy="INV-1044">
        INV-1044
      </DescriptionItem>
      <DescriptionItem label="Customer">Acme Corp</DescriptionItem>
      <DescriptionItem label="PO number" />
    </DescriptionList>
  );
}

describe('DescriptionList', () => {
  it('is a <dl> of <dt>/<dd> pairs, each wrapped in a <div>', () => {
    const { container } = render(<Details />);
    const dl = must(container.querySelector('dl'));
    const items = Array.from(dl.children);
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.tagName === 'DIV')).toBe(true);
    expect(must(items[1]).querySelector('dt')?.textContent).toBe('Customer');
    expect(must(items[1]).querySelector('dd')?.textContent).toBe('Acme Corp');
  });

  it('an empty value shows "—" but is read as "None"', () => {
    const { container } = render(<Details />);
    const dd = must(container.querySelectorAll('dd')[2]);
    const dash = must(dd.querySelector('[aria-hidden="true"]'));
    expect(dash.textContent).toBe('—');
    expect(dd.textContent).toContain('None');
  });

  it('0 is a value, not empty', () => {
    const { container } = render(
      <DescriptionList>
        <DescriptionItem label="Balance">{0}</DescriptionItem>
      </DescriptionList>,
    );
    expect(must(container.querySelector('dd')).textContent).toBe('0');
  });

  it('the copy button is named after the label and copies the text', async () => {
    const user = userEvent.setup(); // installs a fake clipboard
    render(<Details />);
    await user.click(
      screen.getByRole('button', { name: 'Copy Invoice number' }),
    );
    expect(await navigator.clipboard.readText()).toBe('INV-1044');
    expect(screen.getByRole('status').textContent).toBe('Copied');
  });

  it('when the clipboard fails, it says so', async () => {
    const user = userEvent.setup();
    const spy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValue(new Error('denied'));
    render(<Details />);
    await user.click(
      screen.getByRole('button', { name: 'Copy Invoice number' }),
    );
    expect(screen.getByRole('status').textContent).toMatch(/Couldn’t copy/);
    spy.mockRestore();
  });

  it('the message clears after 2 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Details />);
    await user.click(
      screen.getByRole('button', { name: 'Copy Invoice number' }),
    );
    expect(screen.getByRole('status').textContent).toBe('Copied');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('status').textContent).toBe('');
    vi.useRealTimers();
  });

  it('grid: span="full" takes a whole row', () => {
    const { container } = render(
      <DescriptionList layout="grid">
        <DescriptionItem label="Notes" span="full">
          Split into two payments.
        </DescriptionItem>
      </DescriptionList>,
    );
    const dl = must(container.querySelector('dl'));
    expect(dl.classList.contains('grid')).toBe(true);
    expect(must(dl.firstElementChild).classList.contains('col-span-full')).toBe(
      true,
    );
  });

  it('passes className and attributes to the <dl>', () => {
    const { container } = render(
      <DescriptionList aria-label="Invoice details" className="mt-4">
        <DescriptionItem label="A">1</DescriptionItem>
      </DescriptionList>,
    );
    const dl = must(container.querySelector('dl'));
    expect(dl.getAttribute('aria-label')).toBe('Invoice details');
    expect(dl.classList.contains('mt-4')).toBe(true);
  });
});
