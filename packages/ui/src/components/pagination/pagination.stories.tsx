import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Pagination } from './pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { page: 1, pageCount: 42, onChange: () => undefined },
  // Controlled only, so each story keeps the page in state.
  render: function Render(args) {
    const [page, setPage] = useState(args.page);
    return (
      <div className="flex flex-col gap-3">
        <Pagination {...args} page={page} onChange={setPage} />
        <p className="text-sm text-fg-muted">
          Page {page} of {args.pageCount}
        </p>
      </div>
    );
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Page 1: Previous stays in place but is `aria-disabled`. Click through: the number
 * of buttons never changes, so nothing jumps under the mouse.
 */
export const Default: Story = {};

/** In the middle: a gap on each side of the current page. */
export const Middle: Story = { args: { page: 21 } };

/** Few pages: every number is shown, no gaps. */
export const FewPages: Story = { args: { page: 2, pageCount: 5 } };

/** `siblings={2}`: two numbers either side of the current page. */
export const MoreSiblings: Story = { args: { page: 21, siblings: 2 } };

/**
 * `pageSize` + `onPageSizeChange`: a "Rows per page" picker. Go to page 5 at 25 rows,
 * then switch to 50: you land on page 3, which still shows row 101.
 */
export const WithPageSize: Story = {
  render: function Render() {
    const total = 1042;
    const [page, setPage] = useState(5);
    const [size, setSize] = useState(25);
    const first = (page - 1) * size + 1;
    return (
      <div className="flex max-w-3xl flex-col gap-3">
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
        <p className="text-sm text-fg-muted">
          Showing rows {first}–{Math.min(first + size - 1, total)} of {total}
        </p>
      </div>
    );
  },
};
