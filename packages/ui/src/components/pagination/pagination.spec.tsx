import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { pageForSize, pageItems, Pagination } from './pagination';

describe('pageItems', () => {
  it('shows every page when they all fit', () => {
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('near the start: one gap before the last page', () => {
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
  });

  it('in the middle: gaps on both sides', () => {
    expect(pageItems(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
  });

  it('near the end: one gap after the first page', () => {
    expect(pageItems(10, 10)).toEqual([1, 'gap', 6, 7, 8, 9, 10]);
  });

  it('always the same number of items, so buttons do not jump', () => {
    for (let p = 1; p <= 50; p++) expect(pageItems(p, 50, 2)).toHaveLength(9);
  });
});

function Pager({ start = 1, count = 10 }: { start?: number; count?: number }) {
  const [page, setPage] = useState(start);
  return <Pagination page={page} pageCount={count} onChange={setPage} />;
}

describe('Pagination', () => {
  it('is a nav landmark; the current page is named and marked', () => {
    render(<Pager start={5} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
    const current = screen.getByRole('button', { name: 'Page 5' });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(
      screen
        .getByRole('button', { name: 'Page 4' })
        .hasAttribute('aria-current'),
    ).toBe(false);
  });

  it('clicking a number or Next calls onChange with that page', () => {
    const onChange = vi.fn();
    render(<Pagination page={5} pageCount={10} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 10' }));
    expect(onChange).toHaveBeenLastCalledWith(10);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onChange).toHaveBeenLastCalledWith(6);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('clicking the current page does nothing', () => {
    const onChange = vi.fn();
    render(<Pagination page={5} pageCount={10} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('on page 1, Previous is shown but aria-disabled and does nothing', () => {
    const onChange = vi.fn();
    render(<Pagination page={1} pageCount={10} onChange={onChange} />);
    const prev = screen.getByRole('button', { name: 'Previous' });
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(prev.hasAttribute('disabled')).toBe(false);
    fireEvent.click(prev);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('pressing Next onto the last page keeps focus on Next', () => {
    render(<Pager start={9} />);
    const next = screen.getByRole('button', { name: 'Next' });
    act(() => next.focus());
    fireEvent.click(next);
    expect(
      screen
        .getByRole('button', { name: 'Page 10' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(next);
  });

  it('renders nothing with one page or fewer', () => {
    const { container } = render(
      <Pagination page={1} pageCount={1} onChange={() => undefined} />,
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('pageForSize', () => {
  it('keeps the first visible row on screen', () => {
    expect(pageForSize(5, 25, 50)).toBe(3); // rows 101–125 → 101–150
    expect(pageForSize(3, 50, 25)).toBe(5); // rows 101–150 → 101–125
    expect(pageForSize(1, 25, 100)).toBe(1);
    expect(pageForSize(4, 10, 25)).toBe(2); // row 31 → rows 26–50
  });
});

function SizedPager({ total = 1042 }: { total?: number }) {
  const [page, setPage] = useState(5);
  const [size, setSize] = useState(25);
  return (
    <Pagination
      page={page}
      pageCount={Math.ceil(total / size)}
      onChange={setPage}
      pageSize={size}
      onPageSizeChange={(s, p) => {
        setSize(s);
        setPage(p);
      }}
    />
  );
}

describe('Pagination page-size picker', () => {
  it('is named "Rows per page" and sits outside the nav landmark', () => {
    render(<SizedPager />);
    const picker = screen.getByRole('button', { name: /Rows per page/ });
    expect(picker.textContent).toContain('25');
    expect(
      screen.getByRole('navigation', { name: 'Pagination' }).contains(picker),
    ).toBe(false);
  });

  it('picking 50 on page 5 moves to page 3, keeping your place', async () => {
    render(<SizedPager />);
    fireEvent.click(screen.getByRole('button', { name: /Rows per page/ }));
    await act(() => new Promise((r) => requestAnimationFrame(r)));
    fireEvent.click(screen.getByRole('option', { name: '50' }));
    expect(
      screen
        .getByRole('button', { name: 'Page 3' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen.getByRole('button', { name: /Rows per page/ }).textContent,
    ).toContain('50');
  });

  it('with one page, shows the picker but no page buttons', () => {
    render(
      <Pagination
        page={1}
        pageCount={1}
        onChange={() => undefined}
        pageSize={25}
        onPageSizeChange={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: /Rows per page/ })).toBeTruthy();
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
