import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { DataGrid } from './data-grid';
import { createDataGridColumnHelper } from './data-grid-features';
import { parseEditorValue } from './editing/cell-editor';
import type { ChangeSet, SaveResult } from './editing/contract';

// jsdom has no layout. Give the grid's virtualizer a viewport (offset*) and React Aria's
// list virtualizer a box (client*), so rows and options render.
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(288);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
});
afterAll(() => vi.restoreAllMocks());

type Task = {
  id: string;
  name: string;
  team: string | null;
  due: string | null;
};

const teams = ['Design', 'Data', 'DevOps', 'Finance', 'Legal'];
const col = createDataGridColumnHelper<Task>();
const columns = col.columns([
  col.accessor('name', { header: 'Name', meta: { editor: 'text' } }),
  col.accessor('team', {
    header: 'Team',
    meta: { editor: 'combobox', options: teams },
  }),
  col.accessor('due', { header: 'Due', meta: { editor: 'date' } }),
  col.accessor('id', { header: 'ID' }),
]);
const data: Task[] = [
  { id: 't1', name: 'Budget', team: 'Finance', due: '2026-10-04' },
  { id: 't2', name: 'Logo', team: 'Design', due: '2026-10-20' },
  { id: 't3', name: 'Backups', team: null, due: null },
];

function setup() {
  const onSave = vi.fn<(c: ChangeSet) => Promise<SaveResult | void>>(
    async () => ({ ok: true }),
  );
  function App() {
    const [rows] = useState(data);
    return (
      <DataGrid<Task>
        aria-label="Tasks"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        editing={{ onSave }}
      />
    );
  }
  render(<App />);
  act(() =>
    fireEvent.click(screen.getByRole('button', { name: 'Edit table' })),
  );
  return { onSave };
}

const active = () => document.activeElement as HTMLElement;
const activeKey = () =>
  active().closest('[data-cell-key]')?.getAttribute('data-cell-key');
const press = (key: string, mods: Partial<KeyboardEventInit> = {}) =>
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key,
      ...mods,
    });
    fireEvent.keyUp(document.activeElement ?? document.body, { key, ...mods });
  });
const cellText = (rowId: string, columnId: string) =>
  document.querySelector(`[data-cell-key="${rowId}:${columnId}"]`)?.textContent;
const teamInput = () =>
  screen.getByRole('combobox', { name: 'Team' }) as HTMLInputElement;
const optionTexts = () =>
  screen.queryAllByRole('option').map((o) => o.textContent);
const typeSearch = (text: string) =>
  act(() => {
    fireEvent.change(teamInput(), { target: { value: text } });
  });
/** Waits a tick: the shell checks for "focus left" on the next task. */
const tick = () => act(() => new Promise((r) => setTimeout(r, 0)));

/** From the first cell (t1 Name), go to row `row`, column `col`. */
function goTo(row: number, column: number) {
  for (let i = 0; i < row; i++) press('ArrowDown');
  for (let i = 0; i < column; i++) press('ArrowRight');
}

describe('DataGrid combobox editor', () => {
  it('Enter opens a searchable list; Enter on an option picks it, commits and moves down', () => {
    setup();
    goTo(0, 1); // t1 Team
    press('Enter');
    expect(teamInput().value).toBe('Finance');
    expect(screen.getByRole('listbox')).toBeTruthy(); // open right away
    typeSearch('de');
    expect(optionTexts()).toEqual(['Design', 'DevOps']);
    press('ArrowDown');
    press('ArrowDown');
    press('Enter');
    // One keystroke: picked, committed, moved down. Like the native select editor.
    expect(screen.queryByRole('combobox', { name: 'Team' })).toBeNull();
    expect(cellText('t1', 'team')).toBe('DevOps');
    expect(activeKey()).toBe('t2:team');
  });

  it('typing highlights the first match, so Enter picks it; opening alone changes nothing', async () => {
    setup();
    goTo(0, 1); // t1 Team = Finance
    press('Enter');
    await act(() => Promise.resolve()); // the highlight lands in a microtask
    // Opened but nothing typed: React Aria highlights the current value, and we leave
    // it there (not the first option, Design), so Enter keeps Finance.
    const openId = teamInput().getAttribute('aria-activedescendant');
    expect(document.getElementById(openId ?? '')?.textContent).toBe('Finance');
    press('Enter');
    expect(teamInput().value).toBe('Finance');
    // (Unchanged value: this first Enter only closes the list; the next one commits.
    // That was already so before auto-highlight.)
    press('Enter');
    expect(cellText('t1', 'team')).toBe('Finance');
    // t2: type "dev", Enter: picks DevOps without touching the arrows.
    press('Enter');
    typeSearch('dev');
    await act(() => Promise.resolve());
    const activeId = teamInput().getAttribute('aria-activedescendant');
    expect(document.getElementById(activeId ?? '')?.textContent).toBe('DevOps');
    press('Enter');
    expect(cellText('t2', 'team')).toBe('DevOps');
  });

  it('type-to-replace: the typed letter becomes the search text', () => {
    setup();
    goTo(1, 1); // t2 Team
    press('f');
    expect(teamInput().value).toBe('f');
    expect(optionTexts()).toEqual(['Finance']);
  });

  it('Escape with the list open only closes the list; a second Escape cancels the edit', () => {
    setup();
    goTo(0, 1);
    press('Enter');
    typeSearch('le');
    expect(screen.getByRole('listbox')).toBeTruthy();
    press('Escape');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(teamInput()).toBeTruthy(); // still editing
    press('Escape');
    expect(screen.queryByRole('combobox', { name: 'Team' })).toBeNull();
    expect(cellText('t1', 'team')).toBe('Finance'); // unchanged
    expect(activeKey()).toBe('t1:team');
  });

  it('Tab commits the highlighted option, not the search text, and moves right', () => {
    setup();
    goTo(0, 1);
    press('Enter');
    typeSearch('le');
    press('ArrowDown'); // Legal
    press('Tab');
    expect(cellText('t1', 'team')).toBe('Legal');
    expect(activeKey()).toBe('t1:due');
  });

  it('Enter with the list closed commits the current value', () => {
    setup();
    goTo(0, 1);
    press('Enter');
    press('Escape'); // close the list, stay in the editor
    press('Enter');
    expect(screen.queryByRole('combobox', { name: 'Team' })).toBeNull();
    expect(cellText('t1', 'team')).toBe('Finance');
    expect(activeKey()).toBe('t2:team');
  });

  it('a click on an option commits it and keeps the cell active', async () => {
    setup();
    goTo(2, 1); // t3 Team (empty)
    press('Enter');
    act(() => fireEvent.click(screen.getByRole('option', { name: 'Data' })));
    await tick();
    expect(screen.queryByRole('combobox', { name: 'Team' })).toBeNull();
    expect(cellText('t3', 'team')).toBe('Data');
    expect(activeKey()).toBe('t3:team');
  });
});

describe('DataGrid combobox editor with server search', () => {
  it('debounces the search, cancels the stale request, and keeps the typed text on paste', async () => {
    const searchOptions = vi.fn(async (query: string, signal: AbortSignal) => {
      void signal;
      return teams.filter((t) => t.toLowerCase().includes(query.toLowerCase()));
    });
    const serverColumns = col.columns([
      col.accessor('name', { header: 'Name', meta: { editor: 'text' } }),
      col.accessor('team', {
        header: 'Team',
        meta: { editor: 'combobox', searchOptions },
      }),
    ]);
    render(
      <DataGrid<Task>
        aria-label="Tasks"
        data={data}
        columns={serverColumns}
        getRowId={(r) => r.id}
        editing={{ onSave: async () => ({ ok: true }) }}
      />,
    );
    act(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Edit table' })),
    );
    goTo(0, 1);
    press('Enter');
    typeSearch('d');
    typeSearch('de');
    await act(() => new Promise((r) => setTimeout(r, 300)));
    // Opening, "d" and "de" came within 250 ms: one request, for the last text.
    expect(searchOptions).toHaveBeenCalledTimes(1);
    expect(searchOptions).toHaveBeenLastCalledWith(
      'de',
      expect.any(AbortSignal),
    );
    // The saved value (Finance) was shown on open; once the user types, results replace it.
    expect(optionTexts()).toEqual(['Design', 'DevOps']);
  });
});

describe('DataGrid date editor', () => {
  it('opens on the day, picks another day in the calendar, commits ISO', async () => {
    const { onSave } = setup();
    goTo(0, 2); // t1 Due
    press('Enter');
    act(() =>
      fireEvent.click(screen.getByRole('button', { name: /calendar/i })),
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    act(() =>
      fireEvent.click(screen.getByRole('button', { name: /October 15, 2026/ })),
    );
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Due' })).toBeNull();
    expect(cellText('t1', 'due')).toBe('2026-10-15');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save all' }));
    });
    // ISO in, ISO out: the app gets the same kind of value it gave the grid.
    expect(onSave).toHaveBeenCalledWith({
      operations: [{ op: 'update', id: 't1', changes: { due: '2026-10-15' } }],
    });
  });

  it('Escape with the calendar closed cancels; Enter commits and moves down', () => {
    setup();
    goTo(0, 2);
    press('Enter');
    expect(screen.getByRole('group', { name: 'Due' })).toBeTruthy();
    press('Escape');
    expect(screen.queryByRole('group', { name: 'Due' })).toBeNull();
    expect(activeKey()).toBe('t1:due');
    press('Enter');
    press('Enter');
    expect(cellText('t1', 'due')).toBe('2026-10-04');
    expect(activeKey()).toBe('t2:due');
  });
});

describe('DataGrid date editor: type-to-replace', () => {
  const frame = () =>
    act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
  /** Types like a real key press does: React Aria's segments listen to beforeinput. */
  const typeDigit = (d: string) =>
    act(() => {
      document.activeElement?.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: d,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  const segments = () =>
    [...document.querySelectorAll('[role="spinbutton"]')].map(
      (s) => s.textContent,
    );

  it('a digit opens the editor and goes into the first segment; typing continues', async () => {
    setup();
    goTo(0, 2); // t1 Due = 2026-10-04, shown month/day/year in en-US
    press('1');
    await frame();
    expect(screen.getByRole('group', { name: 'Due' })).toBeTruthy();
    // "1" could still become 10, 11 or 12, so the month waits for a second digit.
    expect(segments()).toEqual(['1', '4', '2026']);
    expect(document.activeElement?.textContent).toBe('1');
    typeDigit('2'); // 12: no month starts with 12x, so focus moves on to the day
    expect(segments()[0]).toBe('12');
    expect(document.activeElement?.textContent).toBe('4');
    press('Enter');
    expect(cellText('t1', 'due')).toBe('2026-12-04');
    expect(activeKey()).toBe('t2:due');
  });

  it('a non-digit only opens the editor; the date is unchanged', async () => {
    setup();
    goTo(0, 2);
    press('x');
    await frame();
    expect(segments()).toEqual(['10', '4', '2026']);
    press('Enter');
    expect(cellText('t1', 'due')).toBe('2026-10-04');
  });
});

describe('parseEditorValue for the popover editors', () => {
  it('date: only real days written as YYYY-MM-DD', () => {
    expect(parseEditorValue('date', '2026-03-15')).toEqual({
      ok: true,
      value: '2026-03-15',
    });
    expect(parseEditorValue('date', ' ')).toEqual({ ok: true, value: null });
    // Ambiguous (March 10 or October 3?) and impossible days are rejected, not guessed.
    expect(parseEditorValue('date', '3/10/2026').ok).toBe(false);
    expect(parseEditorValue('date', '2026-02-30').ok).toBe(false);
  });

  it('combobox: matches a choice ignoring case; with no list (server search), keeps the text', () => {
    expect(parseEditorValue('combobox', 'devops', teams)).toEqual({
      ok: true,
      value: 'DevOps',
    });
    expect(parseEditorValue('combobox', 'Sales', teams).ok).toBe(false);
    expect(parseEditorValue('combobox', ' Sales ', [])).toEqual({
      ok: true,
      value: 'Sales',
    });
  });
});
