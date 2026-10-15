import { render, screen } from '@testing-library/react';
import { DialogBody } from './dialog-parts';

// jsdom has no layout: every box is 0px tall and ResizeObserver doesn't exist.
// So we fake both: a ResizeObserver that reports once when it starts watching,
// and heights where content of more than 3 paragraphs doesn't fit.
class FakeResizeObserver {
  constructor(private callback: () => void) {}
  observe() {
    this.callback();
  }
  disconnect() {
    /* nothing to clean up */
  }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.children.length * 100;
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const paragraphs = (n: number) =>
  Array.from({ length: n }, (_, i) => <p key={i}>Line {i + 1}</p>);

describe('DialogBody', () => {
  it('content that fits: no extra Tab stop', () => {
    render(<DialogBody>{paragraphs(2)}</DialogBody>);
    const body = screen.getByText('Line 1').parentElement as HTMLElement;
    expect(body.hasAttribute('tabindex')).toBe(false);
  });

  it('content that scrolls: a Tab stop, so the arrow keys can scroll it (Safari)', () => {
    render(<DialogBody>{paragraphs(8)}</DialogBody>);
    const body = screen.getByText('Line 1').parentElement as HTMLElement;
    expect(body.getAttribute('tabindex')).toBe('0');
    expect(body.className).toContain('focus-visible:outline-solid');
  });

  it('re-checks when the content changes (e.g. a list finishes loading)', async () => {
    const { rerender } = render(<DialogBody>{paragraphs(2)}</DialogBody>);
    const body = screen.getByText('Line 1').parentElement as HTMLElement;
    expect(body.hasAttribute('tabindex')).toBe(false);
    rerender(<DialogBody>{paragraphs(8)}</DialogBody>);
    // The MutationObserver fires after the DOM change, asynchronously.
    await vi.waitFor(() => expect(body.getAttribute('tabindex')).toBe('0'));
  });
});
