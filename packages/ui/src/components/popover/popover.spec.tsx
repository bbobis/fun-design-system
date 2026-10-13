import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { Button } from '../button';
import { Field } from '../field';
import { Select } from '../select';
import { Popover } from './popover';

/** React Aria moves focus in on the next animation frame. */
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key });
    fireEvent.keyUp(document.activeElement ?? document.body, { key });
  });
const trigger = (name = 'Filters') =>
  screen.getByRole('button', { name, hidden: true });
async function open(name?: string) {
  act(() => trigger(name).focus());
  fireEvent.click(trigger(name));
  await nextFrame();
}

describe('Popover', () => {
  it('opens a dialog named by its title; focus moves inside', async () => {
    render(
      <Popover label="Filters" title="Filter invoices">
        <input aria-label="Customer" />
      </Popover>,
    );
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    await open();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    const dialog = screen.getByRole('dialog', { name: 'Filter invoices' });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('without a title, the panel is named after its trigger', async () => {
    render(
      <Popover label="Filters">
        <p>Nothing here yet</p>
      </Popover>,
    );
    await open();
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeTruthy();
  });

  it('Escape closes it and puts focus back on the trigger', async () => {
    render(
      <Popover label="Filters" title="Filter invoices">
        <input aria-label="Customer" />
      </Popover>,
    );
    await open();
    press('Escape');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
  });

  it('children as a function get `close`, for an Apply button', async () => {
    const onApply = vi.fn();
    render(
      <Popover label="Filters" title="Filter invoices">
        {({ close }) => (
          <Button
            onClick={() => {
              onApply();
              close();
            }}
          >
            Apply
          </Button>
        )}
      </Popover>,
    );
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('can be controlled with open / onOpenChange', async () => {
    function Example() {
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <span data-testid="state">{isOpen ? 'open' : 'closed'}</span>
          <Popover
            label="Filters"
            title="Filter invoices"
            open={isOpen}
            onOpenChange={setOpen}
          >
            <p>Body</p>
          </Popover>
        </>
      );
    }
    render(<Example />);
    await open();
    expect(screen.getByTestId('state').textContent).toBe('open');
    press('Escape');
    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toBe('closed'),
    );
  });

  it('a click on the page behind lands on an invisible layer: it only closes the popover', async () => {
    const onPageClick = vi.fn();
    render(
      <>
        <Popover label="Filters" title="Filter invoices">
          <p>Body</p>
        </Popover>
        <Button onClick={onPageClick}>Export</Button>
      </>,
    );
    await open();
    // React Aria covers the page with a transparent layer while the popover is open,
    // so a real click hits it (not "Export") and the first click just closes.
    const underlay = screen.getByTestId('underlay');
    act(() => {
      fireEvent.pointerDown(underlay);
      fireEvent.pointerUp(underlay);
      fireEvent.click(underlay);
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onPageClick).not.toHaveBeenCalled();
  });

  it('a Select inside: picking an option closes only the Select, not the Popover', async () => {
    const onChange = vi.fn();
    render(
      <Popover label="Filters" title="Filter invoices">
        <Field label="Status">
          <Select
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
            ]}
            onChange={onChange}
          />
        </Field>
      </Popover>,
    );
    await open();
    const status = screen.getByRole('button', { name: /Status/ });
    act(() => status.focus());
    press('ArrowDown'); // open the Select's own list
    await nextFrame();
    expect(screen.getByRole('listbox')).toBeTruthy();
    press('Enter'); // pick the first option
    expect(onChange).toHaveBeenCalledWith('pending');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    // The outer panel is still open: the inner popup was "inside" it.
    expect(
      screen.getByRole('dialog', { name: 'Filter invoices' }),
    ).toBeTruthy();
    // And Escape now closes the outer panel.
    await nextFrame();
    press('Escape');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
