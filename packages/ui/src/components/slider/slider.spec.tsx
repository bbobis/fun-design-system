import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Slider, type SliderValue } from './slider';

const sliders = () => screen.getAllByRole('slider');
const focus = (el: HTMLElement) => act(() => el.focus());
/** The two thumbs of a range: [start, end]. */
const thumbs = () => {
  const [lo, hi] = sliders();
  if (!lo || !hi) throw new Error('expected two thumbs');
  return [lo, hi] as const;
};

describe('Slider', () => {
  describe('one value', () => {
    it('is a slider named by its label, with min, max and value', () => {
      render(<Slider label="Volume" defaultValue={40} />);
      const thumb = screen.getByRole('slider', { name: 'Volume' });
      expect(thumb.tagName).toBe('INPUT');
      expect(thumb.getAttribute('type')).toBe('range');
      expect(thumb.getAttribute('min')).toBe('0');
      expect(thumb.getAttribute('max')).toBe('100');
      expect((thumb as HTMLInputElement).value).toBe('40');
      // The value next to the label.
      expect(screen.getByText('40')).toBeTruthy();
    });

    it('arrows change it by step; Home/End jump to the ends', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Slider
          label="Volume"
          defaultValue={40}
          step={5}
          onChange={onChange}
        />,
      );
      focus(sliders()[0]);
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenLastCalledWith(45);
      await user.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(onChange).toHaveBeenLastCalledWith(35);
      await user.keyboard('{End}');
      expect(onChange).toHaveBeenLastCalledWith(100);
      await user.keyboard('{Home}');
      expect(onChange).toHaveBeenLastCalledWith(0);
    });

    it('onChangeEnd fires once per committed change, with a plain number', async () => {
      const user = userEvent.setup();
      const onChangeEnd = vi.fn();
      render(
        <Slider label="Volume" defaultValue={40} onChangeEnd={onChangeEnd} />,
      );
      focus(sliders()[0]);
      await user.keyboard('{ArrowUp}');
      expect(onChangeEnd).toHaveBeenCalledTimes(1);
      expect(onChangeEnd).toHaveBeenLastCalledWith(41);
    });

    it('formatOptions format the shown and spoken value; the app gets numbers', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Slider
          label="Budget"
          defaultValue={40}
          max={200}
          step={10}
          formatOptions={{
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }}
          onChange={onChange}
        />,
      );
      const thumb = sliders()[0];
      expect(thumb.getAttribute('aria-valuetext')).toBe('$40');
      expect(screen.getByText('$40')).toBeTruthy();
      focus(thumb);
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenLastCalledWith(50);
      expect(thumb.getAttribute('aria-valuetext')).toBe('$50');
    });

    it('controlled: shows the value it is given', async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [v, setV] = useState(10);
        return (
          <>
            <Slider label="Volume" value={v} onChange={setV} />
            <button type="button" onClick={() => setV(90)}>
              Loud
            </button>
          </>
        );
      }
      render(<Controlled />);
      await user.click(screen.getByRole('button', { name: 'Loud' }));
      expect((sliders()[0] as HTMLInputElement).value).toBe('90');
    });
  });

  describe('range (two thumbs)', () => {
    it('a [start, end] value gives two named thumbs and a pair back', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn<(v: [number, number]) => void>();
      render(
        <Slider label="Price" defaultValue={[20, 80]} onChange={onChange} />,
      );
      const [lo, hi] = thumbs();
      expect(lo.getAttribute('aria-label')).toBe('Minimum');
      expect(hi.getAttribute('aria-label')).toBe('Maximum');
      // Each is named by its thumb label plus the slider's label: "Minimum Price".
      expect(screen.getByRole('slider', { name: 'Minimum Price' })).toBe(lo);
      expect(screen.getByRole('slider', { name: 'Maximum Price' })).toBe(hi);
      expect(screen.getByText('20–80')).toBeTruthy();
      focus(hi);
      await user.keyboard('{ArrowLeft}');
      expect(onChange).toHaveBeenLastCalledWith([20, 79]);
    });

    it('the thumbs can’t cross (the prediction): the start stops at the end', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Slider label="Price" defaultValue={[20, 30]} onChange={onChange} />,
      );
      const [lo, hi] = thumbs();
      expect(lo.getAttribute('max')).toBe('30'); // the start's ceiling is the end
      expect(hi.getAttribute('min')).toBe('20');
      focus(lo);
      await user.keyboard('{End}');
      expect(onChange).toHaveBeenLastCalledWith([30, 30]);
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenLastCalledWith([30, 30]);
    });

    it('controlled range stays a range after a change (found in Chromium)', async () => {
      const user = userEvent.setup();
      const seen: unknown[] = [];
      function Controlled() {
        const [v, setV] = useState<[number, number]>([20, 80]);
        return (
          <Slider
            label="Price"
            value={v}
            onChange={(next) => {
              seen.push(next);
              setV(next);
            }}
          />
        );
      }
      render(<Controlled />);
      focus(thumbs()[1]);
      await user.keyboard('{ArrowRight}');
      expect(seen).toEqual([[20, 81]]);
      expect(sliders()).toHaveLength(2);
    });

    it('custom thumb labels', () => {
      render(
        <Slider
          label="Office hours"
          defaultValue={[9, 17]}
          max={24}
          thumbLabels={['Opens', 'Closes']}
        />,
      );
      expect(sliders().map((s) => s.getAttribute('aria-label'))).toEqual([
        'Opens',
        'Closes',
      ]);
    });

    it('the value type follows the shape: number in, number out; pair in, pair out', () => {
      // Type-level check: these compile only with the right callback type.
      const one = (v: number) => v;
      const two = (v: [number, number]) => v;
      render(
        <>
          <Slider label="A" defaultValue={1} onChange={one} />
          <Slider label="B" defaultValue={[1, 2]} onChange={two} />
        </>,
      );
      // @ts-expect-error a single slider never gives back a pair
      void (<Slider label="C" defaultValue={1} onChange={two} />);
      const v: SliderValue = [1, 2];
      expect(v).toHaveLength(2);
    });
  });

  it('description is read with each thumb', () => {
    render(
      <Slider
        label="Price"
        defaultValue={[20, 80]}
        description="Per night, before taxes."
      />,
    );
    for (const thumb of sliders()) {
      const ids = thumb.getAttribute('aria-describedby')?.split(' ') ?? [];
      expect(
        ids.map((id) => document.getElementById(id)?.textContent).join(' '),
      ).toBe('Per night, before taxes.');
    }
  });

  it('disabled: the thumbs are disabled and keys do nothing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Slider label="Volume" defaultValue={40} disabled onChange={onChange} />,
    );
    const thumb = sliders()[0] as HTMLInputElement;
    expect(thumb.disabled).toBe(true);
    await user.tab();
    expect(document.activeElement).not.toBe(thumb);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('name posts each thumb’s number with the form', () => {
    render(
      <form data-testid="f">
        <Slider label="Price" name="price" defaultValue={[20, 80]} />
      </form>,
    );
    const data = new FormData(screen.getByTestId('f') as HTMLFormElement);
    expect(data.getAll('price')).toEqual(['20', '80']);
  });

  it('hideValue hides the shown value; className lands on the root', () => {
    const { container } = render(
      <Slider label="Volume" defaultValue={40} hideValue className="w-64" />,
    );
    expect(screen.queryByText('40')).toBeNull();
    expect((container.firstChild as HTMLElement).className).toContain('w-64');
  });
});
