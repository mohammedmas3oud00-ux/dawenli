import type { Dispatch, SetStateAction } from 'react';
import type {
  FocusSessionRecord,
  Pillar,
  Project,
  SidebarTab,
  Task,
  TimeBlock,
  ValueGoal,
  Vision,
  VaultItem,
  Habit,
} from '../../../types/hierarchical';
import { createId } from '../../../utils/id';
import { toLocalDateKey } from '../../../utils/date';
import { setTaskStatus, toggleTaskStatus, upsertTask } from '../../tasks/utils/taskActions';

type Setter<T> = Dispatch<SetStateAction<T>>;

interface HierarchyCrudDependencies {
  pillars: Pillar[];
  visions: Vision[];
  goals: ValueGoal[];
  projects: Project[];
  tasks: Task[];
  habits: Habit[];
  vaults: VaultItem[];
  timeBlocks: TimeBlock[];
  focusSessions: FocusSessionRecord[];
  selectedPillarId: string | null;
  selectedVisionId: string | null;
  selectedGoalId: string | null;
  selectedProjectId: string | null;
  currentPillar: Pillar | null;
  currentVision: Vision | null;
  currentGoal: ValueGoal | null;
  currentProject: Project | null;
  editingPillar: Pillar | null;
  editingVision: Vision | null;
  editingGoal: ValueGoal | null;
  editingProject: Project | null;
  editingTask: Task | null;
  setPillars: Setter<Pillar[]>;
  setVisions: Setter<Vision[]>;
  setGoals: Setter<ValueGoal[]>;
  setProjects: Setter<Project[]>;
  setTasks: Setter<Task[]>;
  setHabits: Setter<Habit[]>;
  setVaults: Setter<VaultItem[]>;
  setTimeBlocks: Setter<TimeBlock[]>;
  setFocusSessions: Setter<FocusSessionRecord[]>;
  setEditingPillar: Setter<Pillar | null>;
  setEditingVision: Setter<Vision | null>;
  setEditingGoal: Setter<ValueGoal | null>;
  setEditingProject: Setter<Project | null>;
  setEditingTask: Setter<Task | null>;
  setSelectedPillarId: Setter<string | null>;
  setSelectedVisionId: Setter<string | null>;
  setSelectedGoalId: Setter<string | null>;
  setSelectedProjectId: Setter<string | null>;
  setActiveFocusTask: Setter<Task | null>;
  setCurrentTab: Setter<SidebarTab>;
  cleanupDeletedRelationships: (ids: {
    pillarIds?: string[];
    visionIds?: string[];
    goalIds?: string[];
    projectIds?: string[];
    taskIds?: string[];
  }) => void;
  applyStateUpdate: (
    pillars: Pillar[],
    visions: Vision[],
    goals: ValueGoal[],
    projects: Project[],
    tasks: Task[],
  ) => void;
}

export function useHierarchyCrud(deps: HierarchyCrudDependencies) {
  const {
    pillars,
    visions,
    goals,
    projects,
    tasks,
    selectedPillarId,
    selectedVisionId,
    selectedGoalId,
    selectedProjectId,
    currentPillar,
    currentVision,
    currentGoal,
    currentProject,
    editingPillar,
    editingVision,
    editingGoal,
    editingProject,
    editingTask,
    setHabits,
    setVaults,
    setTimeBlocks,
    setFocusSessions,
    setEditingPillar,
    setEditingVision,
    setEditingGoal,
    setEditingProject,
    setEditingTask,
    setSelectedPillarId,
    setSelectedVisionId,
    setSelectedGoalId,
    setSelectedProjectId,
    setActiveFocusTask,
    setCurrentTab,
    cleanupDeletedRelationships,
    applyStateUpdate,
  } = deps;

  const savePillar = (data: Partial<Pillar>) => {
    if (editingPillar)
      applyStateUpdate(
        pillars.map((item) =>
          item.id === editingPillar.id ? { ...item, ...data, updated_at: new Date().toISOString() } : item,
        ),
        visions,
        goals,
        projects,
        tasks,
      );
    else
      applyStateUpdate(
        [
          ...pillars,
          {
            id: createId(),
            title: data.title || 'ركيزة جديدة',
            description: data.description || '',
            pillar_group: data.pillar_group || 'Growth',
            purpose: data.purpose || '',
            priority: data.priority || pillars.length + 1,
            show_on_home: data.show_on_home ?? true,
            status: data.status || 'active',
            progress: 0,
            created_at: new Date().toISOString(),
          },
        ],
        visions,
        goals,
        projects,
        tasks,
      );
    setEditingPillar(null);
  };

  const deletePillar = (pillarId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الركيزة؟ سيتم حذف جميع الرؤى والأهداف والمشاريع والمهام التابعة لها.'))
      return;
    const visionIds = visions.filter((item) => item.pillar_id === pillarId).map((item) => item.id);
    const goalIds = goals
      .filter((item) => item.pillar_id === pillarId || (item.vision_id && visionIds.includes(item.vision_id)))
      .map((item) => item.id);
    const projectIds = projects.filter((item) => goalIds.includes(item.goal_id)).map((item) => item.id);
    const remainingTasks = tasks.filter((item) => !projectIds.includes(item.project_id));
    applyStateUpdate(
      pillars.filter((item) => item.id !== pillarId),
      visions.filter((item) => item.pillar_id !== pillarId),
      goals.filter((item) => !goalIds.includes(item.id)),
      projects.filter((item) => !projectIds.includes(item.id)),
      remainingTasks,
    );
    setHabits((items) => items.filter((item) => item.pillar_id !== pillarId));
    setVaults((items) => items.filter((item) => item.pillar_id !== pillarId));
    setTimeBlocks((items) =>
      items.filter(
        (item) => item.pillar_id !== pillarId && (!item.project_id || !projectIds.includes(item.project_id)),
      ),
    );
    setFocusSessions((items) =>
      items.map((item) =>
        item.task_id && !remainingTasks.some((task) => task.id === item.task_id) ? { ...item, task_id: null } : item,
      ),
    );
    cleanupDeletedRelationships({
      pillarIds: [pillarId],
      visionIds,
      goalIds,
      projectIds,
      taskIds: tasks.filter((item) => !remainingTasks.some((task) => task.id === item.id)).map((item) => item.id),
    });
    if (selectedPillarId === pillarId) {
      setSelectedPillarId(null);
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    }
  };

  const saveVision = (data: Partial<Vision>) => {
    if (editingVision)
      applyStateUpdate(
        pillars,
        visions.map((item) =>
          item.id === editingVision.id ? { ...item, ...data, updated_at: new Date().toISOString() } : item,
        ),
        goals,
        projects,
        tasks,
      );
    else {
      const pillarId = data.pillar_id || selectedPillarId;
      if (!pillarId || !pillars.some((item) => item.id === pillarId)) {
        alert('أنشئ ركيزة أو اختر ركيزة صحيحة أولًا.');
        return;
      }
      applyStateUpdate(
        pillars,
        [
          ...visions,
          {
            id: createId(),
            pillar_id: pillarId,
            title: data.title || 'رؤية جديدة',
            description: data.description || '',
            timeframe: data.timeframe || '3-5 سنوات',
            status: data.status || 'active',
            progress: 0,
            created_at: new Date().toISOString(),
          },
        ],
        goals,
        projects,
        tasks,
      );
    }
    setEditingVision(null);
  };

  const deleteVision = (visionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرؤية وجميع الأهداف والمشاريع والمهام المرتبطة بها؟')) return;
    const goalIds = goals.filter((item) => item.vision_id === visionId).map((item) => item.id);
    const projectIds = projects.filter((item) => goalIds.includes(item.goal_id)).map((item) => item.id);
    const remainingTasks = tasks.filter((item) => !projectIds.includes(item.project_id));
    applyStateUpdate(
      pillars,
      visions.filter((item) => item.id !== visionId),
      goals.filter((item) => item.vision_id !== visionId),
      projects.filter((item) => !projectIds.includes(item.id)),
      remainingTasks,
    );
    setTimeBlocks((items) => items.filter((item) => !item.project_id || !projectIds.includes(item.project_id)));
    setFocusSessions((items) =>
      items.map((item) =>
        item.task_id && !remainingTasks.some((task) => task.id === item.task_id) ? { ...item, task_id: null } : item,
      ),
    );
    cleanupDeletedRelationships({
      visionIds: [visionId],
      goalIds,
      projectIds,
      taskIds: tasks.filter((item) => !remainingTasks.some((task) => task.id === item.id)).map((item) => item.id),
    });
    if (selectedVisionId === visionId) {
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    }
  };

  const saveGoal = (data: Partial<ValueGoal>) => {
    if (editingGoal)
      applyStateUpdate(
        pillars,
        visions,
        goals.map((item) =>
          item.id === editingGoal.id ? { ...item, ...data, updated_at: new Date().toISOString() } : item,
        ),
        projects,
        tasks,
      );
    else {
      const pillarId = data.pillar_id || currentVision?.pillar_id || currentPillar?.id;
      if (!pillarId || !pillars.some((item) => item.id === pillarId)) {
        alert('أنشئ ركيزة أو اختر ركيزة صحيحة أولًا.');
        return;
      }
      const visionId = currentVision?.id || data.vision_id;
      if (visionId && !visions.some((item) => item.id === visionId && item.pillar_id === pillarId)) {
        alert('الرؤية المختارة لا تتبع الركيزة المحددة.');
        return;
      }
      applyStateUpdate(
        pillars,
        visions,
        [
          ...goals,
          {
            id: createId(),
            pillar_id: pillarId,
            vision_id: visionId,
            title: data.title || 'هدف قيمة جديد',
            description: data.description || '',
            status: data.status || 'not_started',
            target_date: data.target_date || null,
            progress: 0,
            created_at: new Date().toISOString(),
          },
        ],
        projects,
        tasks,
      );
    }
    setEditingGoal(null);
  };

  const deleteGoal = (goalId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الهدف وجميع المشاريع والمهام التابعة له؟')) return;
    const projectIds = projects.filter((item) => item.goal_id === goalId).map((item) => item.id);
    const remainingTasks = tasks.filter((item) => !projectIds.includes(item.project_id));
    applyStateUpdate(
      pillars,
      visions,
      goals.filter((item) => item.id !== goalId),
      projects.filter((item) => item.goal_id !== goalId),
      remainingTasks,
    );
    setTimeBlocks((items) => items.filter((item) => !item.project_id || !projectIds.includes(item.project_id)));
    setFocusSessions((items) =>
      items.map((item) =>
        item.task_id && !remainingTasks.some((task) => task.id === item.task_id) ? { ...item, task_id: null } : item,
      ),
    );
    cleanupDeletedRelationships({
      goalIds: [goalId],
      projectIds,
      taskIds: tasks.filter((item) => !remainingTasks.some((task) => task.id === item.id)).map((item) => item.id),
    });
    if (selectedGoalId === goalId) {
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    }
  };

  const saveProject = (data: Partial<Project>) => {
    if (editingProject)
      applyStateUpdate(
        pillars,
        visions,
        goals,
        projects.map((item) =>
          item.id === editingProject.id ? { ...item, ...data, updated_at: new Date().toISOString() } : item,
        ),
        tasks,
      );
    else {
      const goalId = data.goal_id || currentGoal?.id;
      if (!goalId || !goals.some((item) => item.id === goalId)) {
        alert('أنشئ هدف قيمة أو اختر هدفًا صحيحًا أولًا.');
        return;
      }
      const today = toLocalDateKey();
      applyStateUpdate(
        pillars,
        visions,
        goals,
        [
          ...projects,
          {
            id: createId(),
            goal_id: goalId,
            title: data.title || 'مشروع جديد',
            description: data.description || '',
            status: data.status || 'in_progress',
            progress: 0,
            start_date: data.start_date || today,
            due_date: data.due_date || today,
            created_at: new Date().toISOString(),
          },
        ],
        tasks,
      );
    }
    setEditingProject(null);
  };

  const deleteProject = (projectId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع وجميع مهامه؟')) return;
    const remainingTasks = tasks.filter((item) => item.project_id !== projectId);
    applyStateUpdate(
      pillars,
      visions,
      goals,
      projects.filter((item) => item.id !== projectId),
      remainingTasks,
    );
    setVaults((items) => items.map((item) => (item.project_id === projectId ? { ...item, project_id: null } : item)));
    setTimeBlocks((items) => items.filter((item) => item.project_id !== projectId));
    setFocusSessions((items) =>
      items.map((item) =>
        item.task_id && !remainingTasks.some((task) => task.id === item.task_id) ? { ...item, task_id: null } : item,
      ),
    );
    cleanupDeletedRelationships({
      projectIds: [projectId],
      taskIds: tasks.filter((item) => !remainingTasks.some((task) => task.id === item.id)).map((item) => item.id),
    });
    if (selectedProjectId === projectId) setSelectedProjectId(null);
  };

  const saveTask = (data: Partial<Task>) => {
    const updated = upsertTask(
      tasks,
      projects,
      { ...data, project_id: data.project_id || currentProject?.id },
      data.id || editingTask?.id,
    );
    if (!updated) {
      alert('أنشئ مشروعًا أو اختر مشروعًا صحيحًا أولًا.');
      return;
    }
    applyStateUpdate(pillars, visions, goals, projects, updated);
    setEditingTask(null);
  };
  const toggleStatus = (id: string) => applyStateUpdate(pillars, visions, goals, projects, toggleTaskStatus(tasks, id));
  const updateStatus = (id: string, status: Task['status']) =>
    applyStateUpdate(pillars, visions, goals, projects, setTaskStatus(tasks, id, status));
  const updateTaskCustomFields = (id: string, fields: Record<string, any>) =>
    applyStateUpdate(
      pillars,
      visions,
      goals,
      projects,
      tasks.map((item) =>
        item.id === id ? { ...item, custom_fields: fields, updated_at: new Date().toISOString() } : item,
      ),
    );
  const updateProjectStatus = (id: string, status: Project['status']) =>
    applyStateUpdate(
      pillars,
      visions,
      goals,
      projects.map((item) => (item.id === id ? { ...item, status, updated_at: new Date().toISOString() } : item)),
      tasks,
    );
  const updateProjectCustomFields = (id: string, fields: Record<string, any>) =>
    applyStateUpdate(
      pillars,
      visions,
      goals,
      projects.map((item) =>
        item.id === id ? { ...item, custom_fields: fields, updated_at: new Date().toISOString() } : item,
      ),
      tasks,
    );
  const deleteTask = (id: string) => {
    const remaining = tasks.filter((item) => item.id !== id);
    applyStateUpdate(pillars, visions, goals, projects, remaining);
    setTimeBlocks((items) => items.map((item) => (item.task_id === id ? { ...item, task_id: null } : item)));
    setFocusSessions((items) => items.map((item) => (item.task_id === id ? { ...item, task_id: null } : item)));
    cleanupDeletedRelationships({ taskIds: [id] });
  };

  const startFocus = (task: Task) => {
    setActiveFocusTask(task);
    setCurrentTab('focus');
  };
  const saveFocusSession = (session: FocusSessionRecord) =>
    setFocusSessions((items) => [session, ...items.filter((item) => item.id !== session.id)]);
  const saveTimeBlock = (block: TimeBlock) =>
    setTimeBlocks((items) =>
      items.some((item) => item.id === block.id)
        ? items.map((item) => (item.id === block.id ? block : item))
        : [block, ...items],
    );
  const saveTimeBlocks = (blocks: TimeBlock[]) =>
    setTimeBlocks((items) => {
      const ids = new Set(blocks.map((item) => item.id));
      return [...blocks, ...items.filter((item) => !ids.has(item.id))];
    });
  const deleteTimeBlock = (id: string) => setTimeBlocks((items) => items.filter((item) => item.id !== id));
  const toggleTimeBlockStatus = (id: string) =>
    setTimeBlocks((items) =>
      items.map((item) => (item.id === id ? { ...item, is_completed: !item.is_completed } : item)),
    );

  return {
    savePillar,
    deletePillar,
    saveVision,
    deleteVision,
    saveGoal,
    deleteGoal,
    saveProject,
    deleteProject,
    saveTask,
    toggleStatus,
    updateStatus,
    updateTaskCustomFields,
    updateProjectStatus,
    updateProjectCustomFields,
    deleteTask,
    startFocus,
    saveFocusSession,
    saveTimeBlock,
    saveTimeBlocks,
    deleteTimeBlock,
    toggleTimeBlockStatus,
  };
}
