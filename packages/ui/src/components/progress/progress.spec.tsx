import { render, screen } from '@testing-library/react';
import { ProgressBar, Spinner } from './progress';

describe('Spinner', () => {
  it('is a progressbar with no value, named by its label', () => {
    render(<Spinner label="Loading invoices" />);
    const spinner = screen.getByRole('progressbar', {
      name: 'Loading invoices',
    });
    expect(spinner.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('defaults its name to "Loading"', () => {
    render(<Spinner />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeTruthy();
  });
});

describe('ProgressBar', () => {
  it('reports its value to screen readers, named by the visible label', () => {
    render(<ProgressBar label="Uploading invoices.csv" value={45} />);
    const bar = screen.getByRole('progressbar', {
      name: 'Uploading invoices.csv',
    });
    expect(bar.getAttribute('aria-valuenow')).toBe('45');
    expect(bar.getAttribute('aria-valuetext')).toBe('45%');
    expect(screen.getByText('45%')).toBeTruthy();
  });

  it('valueLabel replaces the percentage, on screen and for screen readers', () => {
    render(
      <ProgressBar
        label="Importing"
        value={120}
        max={300}
        valueLabel="120 of 300 rows"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Importing' });
    expect(bar.getAttribute('aria-valuetext')).toBe('120 of 300 rows');
    expect(screen.getByText('120 of 300 rows')).toBeTruthy();
  });

  it('without a value it is indeterminate: no aria-valuenow, no value text', () => {
    render(<ProgressBar label="Preparing export" />);
    const bar = screen.getByRole('progressbar', { name: 'Preparing export' });
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(screen.queryByText('%', { exact: false })).toBeNull();
  });

  it('hideValue hides the text but keeps aria-valuetext', () => {
    render(<ProgressBar label="Saving" value={80} hideValue />);
    expect(screen.queryByText('80%')).toBeNull();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe(
      '80%',
    );
  });

  it('hideLabel keeps the name for screen readers but hides the label row', () => {
    render(<ProgressBar label="Uploading a.pdf" value={40} hideLabel />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading a.pdf' });
    expect(bar.getAttribute('aria-valuetext')).toBe('40%');
    expect(screen.getByText('Uploading a.pdf').className).toContain('sr-only');
    expect(screen.queryByText('40%')).toBeNull();
  });
});
