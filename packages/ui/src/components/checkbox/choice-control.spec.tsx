import { render, screen } from '@testing-library/react';
import { CheckboxGroup, CheckboxGroupItem } from '../checkbox-group';
import { Radio, RadioGroup } from '../radio-group';
import { Switch } from '../switch';
import { Checkbox } from './checkbox';
import { choiceSize } from './choice-control';

/** The element a choice's label and control live in (React Aria's <label>). */
const choiceOf = (name: string) =>
  screen.getByText(name).closest('label') as HTMLElement;

describe('choice controls: size', () => {
  it('standalone Checkbox: box and tick follow size', () => {
    render(<Checkbox aria-label="Accept" size="lg" defaultChecked />);
    const input = screen.getByRole('checkbox', { name: 'Accept' });
    expect(input.className).toContain(choiceSize.box.lg);
    expect(input.parentElement?.className).toContain(choiceSize.box.lg);
    expect(input.nextElementSibling?.getAttribute('class')).toContain(
      choiceSize.tick.lg,
    );
  });

  it('CheckboxGroup: size is set once and every item follows (context)', () => {
    render(
      <CheckboxGroup label="Copies" size="sm">
        <CheckboxGroupItem value="a">Accounting</CheckboxGroupItem>
        <CheckboxGroupItem value="b">Billing</CheckboxGroupItem>
      </CheckboxGroup>,
    );
    for (const name of ['Accounting', 'Billing']) {
      const choice = choiceOf(name);
      expect(choice.className).toContain(choiceSize.text.sm);
      expect(choice.querySelector('[aria-hidden]')?.className).toContain(
        choiceSize.box.sm,
      );
    }
  });

  it('RadioGroup: size reaches the dot', () => {
    render(
      <RadioGroup label="Plan" size="lg" defaultValue="pro">
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
      </RadioGroup>,
    );
    expect(choiceOf('Pro').className).toContain(choiceSize.text.lg);
    expect(choiceOf('Pro').innerHTML).toContain(choiceSize.dot.lg);
  });

  it('Switch: track and thumb follow size', () => {
    render(<Switch size="lg">Dark mode</Switch>);
    expect(choiceOf('Dark mode').innerHTML).toContain(choiceSize.track.lg);
  });

  it('defaults are md (today’s look)', () => {
    render(
      <>
        <Checkbox aria-label="X" />
        <Switch>Y</Switch>
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'X' }).className).toContain(
      'size-4',
    );
    expect(choiceOf('Y').innerHTML).toContain('h-5 w-9');
  });
});

describe('choice controls: labelPosition and description', () => {
  it('start only changes the visual order (the prediction)', () => {
    render(
      <>
        <Switch labelPosition="start">Email me</Switch>
        <RadioGroup label="Plan" labelPosition="start">
          <Radio value="pro">Pro</Radio>
        </RadioGroup>
      </>,
    );
    for (const name of ['Email me', 'Pro']) {
      const choice = choiceOf(name);
      expect(choice.className).toContain('flex-row-reverse');
      // The control (and its input) still comes first in the DOM, inside the same
      // <label>: the name and the Tab order don't change.
      expect(choice.querySelector('input')).toBeTruthy();
    }
    expect(screen.getByRole('switch', { name: 'Email me' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeTruthy();
  });

  it('Switch description: named by the label only, described by the second line', () => {
    render(
      <Switch description="Sent to billing@acme.example">
        Email me when paid
      </Switch>,
    );
    const sw = screen.getByRole('switch', { name: 'Email me when paid' });
    const ids = sw.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids.map((i) => document.getElementById(i)?.textContent)).toContain(
      'Sent to billing@acme.example',
    );
  });
});
