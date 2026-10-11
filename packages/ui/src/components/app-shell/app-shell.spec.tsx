import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { AppShell } from './app-shell';
import { SideNav, SideNavItem, SideNavSection } from './side-nav';

const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

function App() {
  return (
    <AppShell
      brand={<a href="/">Acme</a>}
      actions={<button type="button">Account</button>}
      sidebar={
        <SideNav aria-label="Main">
          <SideNavSection>
            <SideNavItem href="/">Dashboard</SideNavItem>
          </SideNavSection>
          <SideNavSection title="Billing">
            <SideNavItem href="/invoices" current>
              Invoices
            </SideNavItem>
            <SideNavItem href="/payments">Payments</SideNavItem>
          </SideNavSection>
        </SideNav>
      }
    >
      <h1>Invoices</h1>
    </AppShell>
  );
}

describe('AppShell', () => {
  it('has header, nav and main landmarks', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
    expect(
      within(screen.getByRole('main')).getByRole('heading').textContent,
    ).toBe('Invoices');
  });

  it('the skip link comes first and points at <main>, which can take focus', () => {
    const { container } = render(<App />);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    // First focusable thing in the document order.
    expect(container.querySelector('a, button')).toBe(skip);
    const main = screen.getByRole('main');
    expect(skip.getAttribute('href')).toBe(`#${main.id}`);
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  it('marks the current page; sections name their lists', () => {
    render(<App />);
    expect(
      screen
        .getByRole('link', { name: 'Invoices' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen
        .getByRole('link', { name: 'Payments' })
        .hasAttribute('aria-current'),
    ).toBe(false);
    expect(
      within(screen.getByRole('list', { name: 'Billing' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(2);
  });

  it('☰ opens the nav in a modal drawer; Escape closes it and focus returns to ☰', async () => {
    render(<App />);
    const open = screen.getByRole('button', { name: 'Open navigation' });
    expect(open.getAttribute('aria-expanded')).toBe('false');
    // A real click focuses the button first; fireEvent.click doesn't.
    act(() => open.focus());
    fireEvent.click(open);
    await nextFrame();
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    expect(drawer.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document.activeElement ?? drawer, { key: 'Escape' });
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(open);
  });

  it('choosing a link in the drawer closes it', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    await nextFrame();
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    fireEvent.click(within(drawer).getByRole('link', { name: 'Payments' }));
    await nextFrame();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('AppShell collapsible sidebar', () => {
  // jsdom ignores CSS, so the wide sidebar's nav is the first "Main" nav in the DOM
  // (the drawer's copy only exists while the drawer is open).
  const toggle = () => screen.getByRole('button', { name: /sidebar$/ });

  it('the toggle says what it does and what it controls', () => {
    render(<App />);
    const button = toggle();
    expect(button.getAttribute('aria-label')).toBe('Collapse sidebar');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const aside = document.getElementById(
      button.getAttribute('aria-controls') ?? '',
    );
    expect(aside?.tagName).toBe('ASIDE');
  });

  it('collapsed: links keep their names and the current page; titles still name lists', () => {
    render(<App />);
    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-label')).toBe('Expand sidebar');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    const invoices = screen.getByRole('link', { name: 'Invoices' });
    expect(invoices.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('list', { name: 'Billing' })).toBeTruthy();
    // The label is visually hidden, not removed.
    expect(within(invoices).getByText('Invoices').className).toContain(
      'sr-only',
    );
  });

  it('items without an icon show their first letter when collapsed', () => {
    render(<App />);
    fireEvent.click(toggle());
    const dashboard = screen.getByRole('link', { name: 'Dashboard' });
    const letter = dashboard.querySelector('[aria-hidden="true"]');
    expect(letter?.textContent).toBe('D');
  });

  it('controlled: follows sidebarCollapsed and reports changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <AppShell
        brand="Acme"
        sidebar={<span />}
        sidebarCollapsed
        onSidebarCollapsedChange={onChange}
      >
        x
      </AppShell>,
    );
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenCalledWith(false);
    // Still collapsed until the parent says otherwise.
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    rerender(
      <AppShell
        brand="Acme"
        sidebar={<span />}
        sidebarCollapsed={false}
        onSidebarCollapsedChange={onChange}
      >
        x
      </AppShell>,
    );
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
  });

  it('the drawer is never collapsed', async () => {
    render(<App />);
    fireEvent.click(toggle());
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    await nextFrame();
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    expect(within(drawer).getByText('Invoices').className).not.toContain(
      'sr-only',
    );
  });
});
