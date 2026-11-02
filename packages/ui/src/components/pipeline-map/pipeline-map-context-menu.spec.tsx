import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { PipelineMap } from './pipeline-map';
import { DEMO_NETWORK, DEMO_PRODUCTS } from './pipeline-map.fixtures';

type MapProps = Partial<React.ComponentProps<typeof PipelineMap>>;
const renderMap = (props: MapProps = {}) =>
  render(
    <PipelineMap
      network={DEMO_NETWORK}
      products={DEMO_PRODUCTS}
      aria-label="Demo network"
      contextMenu
      {...props}
    />,
  );
const item = (id: string) =>
  document.querySelector(`[data-map-item="${id}"]`) as HTMLElement;

describe('PipelineMap context menu', () => {
  it('is off by default: right-click keeps the browser menu', () => {
    render(
      <PipelineMap
        network={DEMO_NETWORK}
        products={DEMO_PRODUCTS}
        aria-label="Demo network"
      />,
    );
    const notPrevented = fireEvent.contextMenu(item('C'));
    expect(notPrevented).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('Shift+F10 opens it on the focused item; Escape closes and focus goes back', async () => {
    const user = userEvent.setup();
    renderMap({ defaultSelectedId: 'C' });
    await user.tab(); // Station C (the selection is the tab stop)
    await user.keyboard('{Escape}'); // close the tooltip first
    await user.keyboard('{Shift>}{F10}{/Shift}');
    const menu = screen.getByRole('menu', { name: 'Actions for Station C' });
    expect(menu).toBeTruthy();
    // Keyboard users land on the first item.
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe('Deselect'),
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(item('C')));
  });

  it('the Menu key opens it too, and an action returns focus to the item', async () => {
    const user = userEvent.setup();
    const onTraceChange = vi.fn();
    renderMap({ onTraceChange });
    await user.tab(); // Terminal A
    await user.keyboard('{ContextMenu}');
    await user.keyboard('{ArrowDown}{Enter}'); // "Trace flow from here"
    await waitFor(() => expect(onTraceChange).toHaveBeenCalledWith('A'));
    expect(screen.queryByRole('menu')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(item('A')));
  });

  it('right-click a pipe: follow one of its batches', async () => {
    const user = userEvent.setup();
    const onFollowBatchChange = vi.fn();
    renderMap({ onFollowBatchChange });
    const notPrevented = fireEvent.contextMenu(item('A-B'), {
      clientX: 200,
      clientY: 100,
    });
    expect(notPrevented).toBe(false); // the browser menu is replaced
    expect(
      screen.getByRole('menu', { name: 'Actions for Terminal A to Station B' }),
    ).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Follow a batch' })).toBeTruthy();
    await user.click(screen.getByRole('menuitem', { name: 'B-1042 · DIL' }));
    await waitFor(() =>
      expect(onFollowBatchChange).toHaveBeenCalledWith('B-1042'),
    );
  });

  it('labels say what a second pick does ("Deselect", "Stop tracing", "Stop following")', () => {
    renderMap({
      defaultSelectedId: 'A-B',
      defaultTracedId: 'A-B',
      defaultFollowedBatch: 'B-1041',
    });
    fireEvent.contextMenu(item('A-B'));
    for (const name of ['Deselect', 'Stop tracing', 'Stop following B-1041'])
      expect(screen.getByRole('menuitem', { name })).toBeTruthy();
  });

  it('apps add items; one that moves focus on purpose keeps it there', async () => {
    const user = userEvent.setup();
    function Page() {
      const panelRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <PipelineMap
            network={DEMO_NETWORK}
            products={DEMO_PRODUCTS}
            aria-label="Demo network"
            contextMenu={(id) => [
              {
                label: `Show details of ${id}`,
                onAction: () => panelRef.current?.focus(),
              },
            ]}
          />
          <button ref={panelRef} type="button">
            Panel
          </button>
        </>
      );
    }
    render(<Page />);
    await user.tab(); // Terminal A
    await user.keyboard('{Shift>}{F10}{/Shift}');
    await user.click(
      screen.getByRole('menuitem', { name: 'Show details of A' }),
    );
    // The action runs after the menu closes (and focus is back on the item), so the
    // focus it moves sticks. Run inside the menu, the popover's focus trap undid it.
    await waitFor(() =>
      expect(document.activeElement?.textContent).toBe('Panel'),
    );
  });
});
