import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDashboardNavigation } from './useDashboardNavigation';

describe('useDashboardNavigation', () => {
  it('starts at the hierarchy root and remembers selections', () => {
    const { result } = renderHook(() => useDashboardNavigation());
    expect(result.current.currentTab).toBe('hierarchy');
    expect(result.current.activeFocusTask).toBeNull();
    expect(result.current.isMobileSidebarOpen).toBe(false);

    act(() => {
      result.current.setCurrentTab('calendar');
      result.current.setSelectedPillarId('pillar-1');
      result.current.setSelectedVisionId('vision-1');
      result.current.setSelectedGoalId('goal-1');
      result.current.setSelectedProjectId('project-1');
      result.current.setActiveFocusTask({ id: 'task-1' } as never);
      result.current.setIsMobileSidebarOpen(true);
    });

    expect(result.current.currentTab).toBe('calendar');
    expect(result.current.selectedPillarId).toBe('pillar-1');
    expect(result.current.selectedVisionId).toBe('vision-1');
    expect(result.current.selectedGoalId).toBe('goal-1');
    expect(result.current.selectedProjectId).toBe('project-1');
    expect(result.current.activeFocusTask).toEqual({ id: 'task-1' });
    expect(result.current.isMobileSidebarOpen).toBe(true);
  });
});
