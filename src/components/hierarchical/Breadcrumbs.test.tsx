import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';
import type { BreadcrumbItem } from '../../types/hierarchical';

const items: BreadcrumbItem[] = [
  { id: 'root', label: 'الكل', type: 'root' },
  { id: 'pillar-1', label: 'روحاني', type: 'pillar' },
  { id: 'vision-1', label: 'رؤية', type: 'vision' },
  { id: 'goal-1', label: 'هدف', type: 'goal' },
  { id: 'project-1', label: 'مشروع', type: 'project' },
];

describe('Breadcrumbs', () => {
  afterEach(() => cleanup());

  it('renders every item and disables the last one', () => {
    render(<Breadcrumbs items={items} onNavigate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'مشروع' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'الكل' })).toBeEnabled();
  });

  it('invokes navigation for non-terminal items', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumbs items={items} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /روحاني/ }));
    expect(onNavigate).toHaveBeenCalledWith(items[1]);
  });

  it('does not navigate from the terminal item', () => {
    const onNavigate = vi.fn();
    render(<Breadcrumbs items={items} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: 'مشروع' }));
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
