import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar, AvatarGroup, initialsOf, toneFor } from './avatar';

describe('initialsOf', () => {
  it('first and last word, upper case, by character', () => {
    expect(initialsOf('Dana Smith')).toBe('DS');
    expect(initialsOf('Prince')).toBe('P');
    expect(initialsOf('  ana  maría  lópez ')).toBe('AL');
    expect(initialsOf('åsa öberg')).toBe('ÅÖ');
    expect(initialsOf('😀 Bot')).toBe('😀B');
    expect(initialsOf('')).toBe('');
  });
});

describe('toneFor', () => {
  it('the same name always gets the same tone', () => {
    expect(toneFor('Dana Smith')).toBe(toneFor('Dana Smith'));
    const names = ['Ann', 'Bo', 'Cy', 'Di', 'Ed', 'Flo', 'Gus', 'Hal'];
    // Not everyone the same colour.
    expect(new Set(names.map(toneFor)).size).toBeGreaterThan(1);
  });
});

describe('Avatar', () => {
  it('without a photo: one image named by `name`, showing initials', () => {
    render(<Avatar name="Dana Smith" />);
    const avatar = screen.getByRole('img', { name: 'Dana Smith' });
    expect(avatar.textContent).toBe('DS');
    expect(avatar.querySelector('img')).toBeNull();
  });

  it('a photo covers the initials only once it has loaded', () => {
    render(<Avatar name="Dana Smith" src="/dana.jpg" />);
    const photo = screen
      .getByRole('img', { name: 'Dana Smith' })
      .querySelector('img');
    expect(photo?.getAttribute('alt')).toBe(''); // the span carries the name
    expect(photo?.className).toContain('opacity-0');
    if (photo) fireEvent.load(photo);
    expect(photo?.className).toContain('opacity-100');
  });

  it('a broken photo (404) falls back to initials; same name (the prediction)', () => {
    render(<Avatar name="Dana Smith" src="/missing.jpg" />);
    const avatar = screen.getByRole('img', { name: 'Dana Smith' });
    const photo = avatar.querySelector('img');
    if (photo) fireEvent.error(photo);
    expect(avatar.querySelector('img')).toBeNull();
    expect(avatar.textContent).toBe('DS');
  });

  it('a new src after a failure gets a fresh try', () => {
    const { rerender } = render(<Avatar name="Dana" src="/a.jpg" />);
    const first = screen
      .getByRole('img', { name: 'Dana' })
      .querySelector('img');
    if (first) fireEvent.error(first);
    rerender(<Avatar name="Dana" src="/b.jpg" />);
    expect(
      screen
        .getByRole('img', { name: 'Dana' })
        .querySelector('img')
        ?.getAttribute('src'),
    ).toBe('/b.jpg');
  });

  it('status: a dot, and the status in the name', () => {
    render(<Avatar name="Dana Smith" status="away" />);
    const avatar = screen.getByRole('img', { name: 'Dana Smith, away' });
    const dot = avatar.querySelector('[data-status="away"]');
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
  });

  it('decorative: hidden from screen readers (the name is printed next to it)', () => {
    render(
      <p>
        <Avatar name="Dana Smith" decorative /> Dana Smith
      </p>,
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('className and native attributes pass through', () => {
    render(<Avatar name="Dana" className="ms-2" data-testid="a" />);
    const a = screen.getByTestId('a');
    expect(a.className).toContain('ms-2');
  });
});

describe('AvatarGroup', () => {
  const people = [
    'Ann Lee',
    'Bo Chen',
    'Cy Diaz',
    'Di Ng',
    'Ed Park',
    'Flo Ruiz',
    'Gus Ito',
  ];
  const group = (extra: Partial<Parameters<typeof AvatarGroup>[0]> = {}) => (
    <AvatarGroup label="Assignees" {...extra}>
      {people.map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </AvatarGroup>
  );

  it('a named group; shows `max`, then "+N" that names the rest', () => {
    render(group({ max: 3 }));
    const g = screen.getByRole('group', { name: 'Assignees' });
    expect(g).toBeTruthy();
    expect(
      screen.getAllByRole('img').map((i) => i.getAttribute('aria-label')),
    ).toEqual([
      'Ann Lee',
      'Bo Chen',
      'Cy Diaz',
      'and 4 more: Di Ng, Ed Park, Flo Ruiz, Gus Ito',
    ]);
    expect(screen.getByText('+4')).toBeTruthy();
  });

  it('never shows "+1": one extra avatar is shown instead', () => {
    render(group({ max: 6 }));
    expect(screen.getAllByRole('img')).toHaveLength(7);
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it('onOverflowPress makes "+N" a button', async () => {
    const user = userEvent.setup();
    const onOverflowPress = vi.fn();
    render(group({ max: 3, onOverflowPress }));
    const more = screen.getByRole('button', {
      name: 'Show all, and 4 more: Di Ng, Ed Park, Flo Ruiz, Gus Ito',
    });
    expect(more.getAttribute('type')).toBe('button');
    await user.click(more);
    expect(onOverflowPress).toHaveBeenCalledTimes(1);
  });

  it('size applies to every avatar', () => {
    render(group({ size: 'sm', max: 3 }));
    for (const img of screen.getAllByRole('img'))
      expect(img.className).toContain('size-8');
  });
});
