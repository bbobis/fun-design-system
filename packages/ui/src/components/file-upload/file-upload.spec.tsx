import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { checkFiles, formatBytes, matchesAccept } from './file-rules';
import { FileUpload } from './file-upload';

const file = (name: string, type: string, size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

describe('file rules', () => {
  it('matchesAccept: exact types, families and extensions', () => {
    const pdf = { name: 'Invoice.PDF', type: 'application/pdf' };
    const png = { name: 'scan.png', type: 'image/png' };
    const csv = { name: 'rows.CSV', type: '' }; // some systems send no type
    expect(matchesAccept(pdf, ['application/pdf'])).toBe(true);
    expect(matchesAccept(png, ['image/*'])).toBe(true);
    expect(matchesAccept(csv, ['.csv'])).toBe(true);
    expect(matchesAccept(png, ['application/pdf', '.csv'])).toBe(false);
    expect(matchesAccept(png, undefined)).toBe(true);
  });

  it('formatBytes: like a file manager', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(10 * 1024 * 1024)).toBe('10 MB');
    expect(formatBytes(250 * 1024 * 1024)).toBe('250 MB');
  });

  it('checkFiles: refuses with a reason a person can act on', () => {
    const { accepted, rejected } = checkFiles(
      [
        file('a.pdf', 'application/pdf'),
        file('b.exe', 'application/x-msdownload'),
        file('c.pdf', 'application/pdf', 3 * 1024 * 1024),
        file('d.pdf', 'application/pdf'),
      ],
      {
        accept: ['application/pdf'],
        maxSize: 2 * 1024 * 1024,
        maxFiles: 2,
        current: 1,
      },
    );
    expect(accepted.map((f) => f.name)).toEqual(['a.pdf']);
    expect(rejected).toEqual([
      { name: 'b.exe', reason: 'isn’t an accepted file type' },
      { name: 'c.pdf', reason: 'is larger than 2 MB' },
      { name: 'd.pdf', reason: 'would go over the limit of 2 files' },
    ]);
  });
});

/** FileTrigger's hidden native input: what the file picker fills in. */
const pick = (container: HTMLElement, files: File[]) =>
  act(() => {
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files } });
  });
const frame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

describe('FileUpload', () => {
  it('is a named group; the picker filters by accept', () => {
    const { container } = render(
      <FileUpload
        label="Receipts"
        description="PDF only."
        accept={['application/pdf']}
      />,
    );
    const group = screen.getByRole('group', { name: 'Receipts' });
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Browse files' })).toBeTruthy();
    const input = container.querySelector('input[type="file"]');
    expect(input?.getAttribute('accept')).toBe('application/pdf');
    expect(input?.hasAttribute('multiple')).toBe(true);
  });

  it('adds picked files to a list with sizes, and announces it', () => {
    const onChange = vi.fn();
    const { container } = render(
      <FileUpload label="Receipts" onChange={onChange} />,
    );
    pick(container, [file('a.pdf', 'application/pdf', 1536)]);
    expect(onChange).toHaveBeenLastCalledWith([expect.any(File)]);
    const list = screen.getByRole('list', { name: 'Receipts' });
    expect(within(list).getByText('a.pdf')).toBeTruthy();
    expect(within(list).getByText('1.5 KB')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Added a.pdf.');
  });

  it('shows and announces why files were refused', () => {
    const { container } = render(
      <FileUpload
        label="Receipts"
        accept={['application/pdf']}
        maxSize={1024}
      />,
    );
    pick(container, [
      file('ok.pdf', 'application/pdf', 100),
      file('big.pdf', 'application/pdf', 5000),
      file('x.exe', 'application/x-msdownload', 100),
    ]);
    expect(screen.getByText('big.pdf').parentElement?.textContent).toBe(
      'big.pdf is larger than 1 KB.',
    );
    expect(screen.getByRole('status').textContent).toBe(
      'Added ok.pdf. big.pdf is larger than 1 KB. x.exe isn’t an accepted file type.',
    );
  });

  it('Remove takes the file out and moves focus to the next Remove, then to Browse', async () => {
    const { container } = render(<FileUpload label="Receipts" />);
    pick(container, [
      file('a.pdf', 'application/pdf'),
      file('b.pdf', 'application/pdf'),
    ]);
    act(() => screen.getByRole('button', { name: 'Remove a.pdf' }).focus());
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
    await frame();
    expect(screen.queryByText('a.pdf')).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Remove b.pdf' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove b.pdf' }));
    await frame();
    expect(screen.queryByRole('list')).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Browse files' }),
    );
    expect(screen.getByRole('status').textContent).toBe('Removed b.pdf.');
  });

  it('multiple={false}: one file; a new one replaces it', () => {
    const onChange = vi.fn();
    const { container } = render(
      <FileUpload label="Logo" multiple={false} onChange={onChange} />,
    );
    expect(
      container.querySelector('input[type="file"]')?.hasAttribute('multiple'),
    ).toBe(false);
    pick(container, [file('one.png', 'image/png')]);
    pick(container, [file('two.png', 'image/png')]);
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: 'two.png' }),
    ]);
    expect(screen.queryByText('one.png')).toBeNull();
  });

  it('shows the error and links it to the group', () => {
    render(<FileUpload label="Receipts" error="Attach at least one receipt" />);
    const group = screen.getByRole('group', { name: 'Receipts' });
    const errorId = group.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(errorId)?.textContent).toBe(
      'Attach at least one receipt',
    );
  });
});
