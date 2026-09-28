import { useState } from 'react';
import type { SidebarTab, Task } from '../../../types/hierarchical';

export function useDashboardNavigation() {
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [currentTab, setCurrentTab] = useState<SidebarTab>('hierarchy');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [selectedVisionId, setSelectedVisionId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return {
    activeFocusTask,
    setActiveFocusTask,
    currentTab,
    setCurrentTab,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    selectedPillarId,
    setSelectedPillarId,
    selectedVisionId,
    setSelectedVisionId,
    selectedGoalId,
    setSelectedGoalId,
    selectedProjectId,
    setSelectedProjectId,
  };
}
