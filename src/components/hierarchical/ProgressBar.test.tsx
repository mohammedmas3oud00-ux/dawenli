import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  afterEach(() => cleanup());

  it('clamps progress and rounds stars', () => {
    render(<ProgressBar progress={150} maxStars={5} />);
    const title = screen.getByTitle(/نجوم/);
    expect(title).toHaveAttribute('title', '100% (5/5 نجوم)');
    expect(title).toHaveTextContent('100%');
  });

  it('hides the percentage when requested', () => {
    render(<ProgressBar progress={40} showPercentage={false} variant="stars" />);
    expect(screen.queryByText('40%')).toBeNull();
  });

  it('renders the bar without stars when variant is bar', () => {
    const { container } = render(<ProgressBar progress={20} variant="bar" />);
    const fill = container.querySelector('[style*="width: 20%"]');
    expect(fill).not.toBeNull();
  });

  it('shows zero stars for empty progress', () => {
    render(<ProgressBar progress={0} maxStars={5} variant="stars" />);
    expect(screen.getByTitle('0% (0/5 نجوم)')).toBeInTheDocument();
  });

  it('applies the completion color at full progress', () => {
    const { container } = render(<ProgressBar progress={100} variant="bar" />);
    const fill = container.querySelector('[style*="width: 100%"]');
    expect(fill?.className).toContain('bg-[#174235]');
  });
});
