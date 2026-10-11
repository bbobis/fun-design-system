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
