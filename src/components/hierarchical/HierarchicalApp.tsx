import React, { useState, useEffect } from 'react';
import { 
  Pillar, 
  Vision,
  ValueGoal, 
  Project, 
  Task, 
  BreadcrumbItem,
  SidebarTab,
  SystemReview,
  ReviewFrequency,
  ReviewActionItem,
  InboxItem,
  Habit,
  VaultItem,
  FocusSessionRecord,
  TimeBlock
} from '../../types/hierarchical';
import { 
  loadHierarchicalState, 
  saveHierarchicalState, 
  recalculateAllHierarchicalProgress,
  loadReviewsState,
  saveReviewsState
} from '../../utils/hierarchicalStore';
import { 
  loadPPVState, 
  saveInboxState, 
  saveHabitsState, 
  saveVaultsState 
} from '../../utils/ppvStore';
import { generateSystemSnapshot } from '../../utils/reviewEngine';

import { Breadcrumbs } from './Breadcrumbs';
import { Sidebar } from './Sidebar';
import { PillarsListView } from './PillarsListView';
import { PillarDetailView } from './PillarDetailView';
import { VisionDetailView } from './VisionDetailView';
import { ValueGoalDetailView } from './ValueGoalDetailView';
import { ProjectDetailView } from './ProjectDetailView';
import { VisionsTabView } from './VisionsTabView';
import { GoalsTabView } from './GoalsTabView';
import { ProjectsTabView } from './ProjectsTabView';
import { TasksTabView } from './TasksTabView';
import { ReviewsTabView } from './ReviewsTabView';
import { ReviewModal } from './ReviewModal';
import { InboxTabView } from './InboxTabView';
import { HabitsTabView } from './HabitsTabView';
import { VaultsTabView } from './VaultsTabView';
import { FocusSessionView } from './FocusSessionView';
import { TimeBlockingView } from './TimeBlockingView';
import { 
  loadFocusSessions, 
  saveFocusSession, 
  loadTimeBlocks, 
  saveTimeBlocks 
} from '../../utils/focusAndTimeBlockStore';
import { 
  PillarModal, 
  VisionModal,
  ValueGoalModal, 
  ProjectModal, 
  TaskModal 
} from './EntityFormModals';
import { QuickAddModal } from './QuickAddModal';
import { SqlSchemaModal } from './SqlSchemaModal';
import { Database, RotateCcw, Plus, Menu } from 'lucide-react';

export const HierarchicalApp: React.FC = () => {
  // Core Entities State
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [visions, setVisions] = useState<Vision[]>([]);
  const [goals, setGoals] = useState<ValueGoal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviews, setReviews] = useState<SystemReview[]>([]);

  // GTD & PPV Extensions State (Inbox, Habits, Vaults)
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [vaults, setVaults] = useState<VaultItem[]>([]);

  // Focus Sessions & Time Blocking State
  const [focusSessions, setFocusSessions] = useState<FocusSessionRecord[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<SidebarTab>('hierarchy');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Drill-Down Selection State (Hierarchical mode)
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [selectedVisionId, setSelectedVisionId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Review Modals State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<SystemReview | null>(null);
  const [defaultReviewFrequency, setDefaultReviewFrequency] = useState<ReviewFrequency>('daily');

  const [isPillarModalOpen, setIsPillarModalOpen] = useState(false);
  const [editingPillar, setEditingPillar] = useState<Pillar | null>(null);

  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [editingVision, setEditingVision] = useState<Vision | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ValueGoal | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load state on mount
  useEffect(() => {
    const loaded = loadHierarchicalState();
    setPillars(loaded.pillars);
    setVisions(loaded.visions);
    setGoals(loaded.goals);
    setProjects(loaded.projects);
    setTasks(loaded.tasks);
    const revs = loadReviewsState(
      loaded.pillars,
      loaded.visions,
      loaded.goals,
      loaded.projects,
      loaded.tasks
    );
    setReviews(revs);

    const { inbox, habits: loadedHabits, vaults: loadedVaults } = loadPPVState(loaded.pillars);
    setInboxItems(inbox);
    setHabits(loadedHabits);
    setVaults(loadedVaults);

    const initialFocus = loadFocusSessions(loaded.tasks);
    setFocusSessions(initialFocus);
    const initialBlocks = loadTimeBlocks(loaded.tasks, loaded.projects, loaded.pillars);
    setTimeBlocks(initialBlocks);
  }, []);

  // Recalculate & Persist Helper
  const applyStateUpdate = (
    newPillars: Pillar[],
    newVisions: Vision[],
    newGoals: ValueGoal[],
    newProjects: Project[],
    newTasks: Task[]
  ) => {
    const recalculated = recalculateAllHierarchicalProgress(
      newPillars,
      newVisions,
      newGoals,
      newProjects,
      newTasks
    );
    setPillars(recalculated.pillars);
    setVisions(recalculated.visions);
    setGoals(recalculated.goals);
    setProjects(recalculated.projects);
    setTasks(recalculated.tasks);
    saveHierarchicalState(
      recalculated.pillars,
      recalculated.visions,
      recalculated.goals,
      recalculated.projects,
      recalculated.tasks
    );
  };

  // Active Entities for drill-down context
  const currentPillar = pillars.find((p) => p.id === selectedPillarId) || null;
  const currentVision = visions.find((v) => v.id === selectedVisionId) || null;
  const currentGoal = goals.find((g) => g.id === selectedGoalId) || null;
  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;

  // Breadcrumbs Generator
  const breadcrumbItems: BreadcrumbItem[] = [
    { id: 'root', label: 'الركائز (Pillars)', type: 'root' },
  ];

  if (currentPillar) {
    breadcrumbItems.push({
      id: currentPillar.id,
      label: currentPillar.title,
      type: 'pillar',
    });
  }

  if (currentVision) {
    breadcrumbItems.push({
      id: currentVision.id,
      label: currentVision.title,
      type: 'vision',
    });
  }

  if (currentGoal) {
    breadcrumbItems.push({
      id: currentGoal.id,
      label: currentGoal.title,
      type: 'goal',
    });
  }

  if (currentProject) {
    breadcrumbItems.push({
      id: currentProject.id,
      label: currentProject.title,
      type: 'project',
    });
  }

  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    setCurrentTab('hierarchy');
    if (item.type === 'root') {
      setSelectedPillarId(null);
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    } else if (item.type === 'pillar') {
      setSelectedPillarId(item.id);
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    } else if (item.type === 'vision') {
      setSelectedVisionId(item.id);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    } else if (item.type === 'goal') {
      setSelectedGoalId(item.id);
      setSelectedProjectId(null);
    } else if (item.type === 'project') {
      setSelectedProjectId(item.id);
    }
  };

  // -------------------------------------------------------------
  // CRUD HANDLERS
  // -------------------------------------------------------------

  // Focus and Time Blocking Handlers
  const handleStartFocus = (task: Task) => {
    setActiveFocusTask(task);
    setCurrentTab('focus');
  };

  const handleSaveFocusSession = (session: FocusSessionRecord) => {
    const updated = saveFocusSession(session);
    setFocusSessions(updated);
  };

  const handleSaveTimeBlock = (block: TimeBlock) => {
    const exists = timeBlocks.some((b) => b.id === block.id);
    const updated = exists
      ? timeBlocks.map((b) => (b.id === block.id ? block : b))
      : [block, ...timeBlocks];
    setTimeBlocks(updated);
    saveTimeBlocks(updated);
  };

  const handleDeleteTimeBlock = (blockId: string) => {
    const updated = timeBlocks.filter((b) => b.id !== blockId);
    setTimeBlocks(updated);
    saveTimeBlocks(updated);
  };

  const handleToggleTimeBlockStatus = (blockId: string) => {
    const updated = timeBlocks.map((b) =>
      b.id === blockId ? { ...b, is_completed: !b.is_completed } : b
    );
    setTimeBlocks(updated);
    saveTimeBlocks(updated);
  };

  // 1. Pillars
  const handleSavePillar = (pillarData: Partial<Pillar>) => {
    if (editingPillar) {
      const updated = pillars.map((p) =>
        p.id === editingPillar.id ? { ...p, ...pillarData, updated_at: new Date().toISOString() } : p
      );
      applyStateUpdate(updated, visions, goals, projects, tasks);
    } else {
      const newP: Pillar = {
        id: `pillar-${Date.now()}`,
        title: pillarData.title || 'ركيزة جديدة',
        description: pillarData.description || '',
        pillar_group: pillarData.pillar_group || 'Growth',
        purpose: pillarData.purpose || '',
        priority: pillarData.priority || pillars.length + 1,
        show_on_home: pillarData.show_on_home ?? true,
        status: pillarData.status || 'active',
        progress: 0,
        created_at: new Date().toISOString(),
      };
      applyStateUpdate([...pillars, newP], visions, goals, projects, tasks);
    }
    setEditingPillar(null);
  };

  const handleDeletePillar = (pillarId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الركيزة؟ سيتم حذف جميع الرؤى والأهداف والمشاريع والمهام التابعة لها.')) return;
    const targetVisions = visions.filter((v) => v.pillar_id === pillarId);
    const targetVisionIds = targetVisions.map((v) => v.id);
    const targetGoals = goals.filter((g) => g.pillar_id === pillarId || (g.vision_id && targetVisionIds.includes(g.vision_id)));
    const targetGoalIds = targetGoals.map((g) => g.id);
    const targetProjects = projects.filter((p) => targetGoalIds.includes(p.goal_id));
    const targetProjectIds = targetProjects.map((p) => p.id);

    const remainingTasks = tasks.filter((t) => !targetProjectIds.includes(t.project_id));
    const remainingProjects = projects.filter((p) => !targetProjectIds.includes(p.id));
    const remainingGoals = goals.filter((g) => !targetGoalIds.includes(g.id));
    const remainingVisions = visions.filter((v) => v.pillar_id !== pillarId);
    const remainingPillars = pillars.filter((p) => p.id !== pillarId);

    applyStateUpdate(remainingPillars, remainingVisions, remainingGoals, remainingProjects, remainingTasks);
    if (selectedPillarId === pillarId) {
      setSelectedPillarId(null);
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    }
  };

  // 2. Visions
  const handleSaveVision = (visionData: Partial<Vision>) => {
    if (editingVision) {
      const updated = visions.map((v) =>
        v.id === editingVision.id ? { ...v, ...visionData, updated_at: new Date().toISOString() } : v
      );
      applyStateUpdate(pillars, updated, goals, projects, tasks);
    } else {
      const targetPillarId = visionData.pillar_id || selectedPillarId || (pillars[0]?.id) || 'pillar-1';
      const newV: Vision = {
        id: `vis-${Date.now()}`,
        pillar_id: targetPillarId,
        title: visionData.title || 'رؤية جديدة',
        description: visionData.description || '',
        timeframe: visionData.timeframe || '3-5 سنوات',
        status: visionData.status || 'active',
        progress: 0,
        created_at: new Date().toISOString(),
      };
      applyStateUpdate(pillars, [...visions, newV], goals, projects, tasks);
    }
    setEditingVision(null);
  };

  const handleDeleteVision = (visionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرؤية وجميع الأهداف والمشاريع والمهام المرتبطة بها؟')) return;
    const targetGoals = goals.filter((g) => g.vision_id === visionId);
    const targetGoalIds = targetGoals.map((g) => g.id);
    const targetProjects = projects.filter((p) => targetGoalIds.includes(p.goal_id));
    const targetProjectIds = targetProjects.map((p) => p.id);

    const remainingTasks = tasks.filter((t) => !targetProjectIds.includes(t.project_id));
    const remainingProjects = projects.filter((p) => !targetProjectIds.includes(p.id));
    const remainingGoals = goals.filter((g) => g.vision_id !== visionId);
    const remainingVisions = visions.filter((v) => v.id !== visionId);

    applyStateUpdate(pillars, remainingVisions, remainingGoals, remainingProjects, remainingTasks);
    if (selectedVisionId === visionId) {
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    }
  };

  // 3. Goals
  const handleSaveGoal = (goalData: Partial<ValueGoal>) => {
    if (editingGoal) {
      const updated = goals.map((g) =>
        g.id === editingGoal.id ? { ...g, ...goalData, updated_at: new Date().toISOString() } : g
      );
      applyStateUpdate(pillars, visions, updated, projects, tasks);
    } else {
      const targetPillarId = currentPillar?.id || (currentVision ? currentVision.pillar_id : (pillars[0]?.id || 'pillar-1'));
      const targetVisionId = currentVision?.id || goalData.vision_id || undefined;
      const newG: ValueGoal = {
        id: `goal-${Date.now()}`,
        pillar_id: targetPillarId,
        vision_id: targetVisionId,
        title: goalData.title || 'هدف قيمة جديد',
        description: goalData.description || '',
        status: goalData.status || 'not_started',
        target_date: goalData.target_date || null,
        progress: 0,
        created_at: new Date().toISOString(),
      };
      applyStateUpdate(pillars, visions, [...goals, newG], projects, tasks);
    }
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الهدف وجميع المشاريع والمهام التابعة له؟')) return;
    const targetProjects = projects.filter((p) => p.goal_id === goalId);
    const targetProjectIds = targetProjects.map((p) => p.id);

    const remainingTasks = tasks.filter((t) => !targetProjectIds.includes(t.project_id));
    const remainingProjects = projects.filter((p) => p.goal_id !== goalId);
    const remainingGoals = goals.filter((g) => g.id !== goalId);

    applyStateUpdate(pillars, visions, remainingGoals, remainingProjects, remainingTasks);
    if (selectedGoalId === goalId) {
      setSelectedGoalId(null);
      setSelectedProjectId(null);
    }
  };

  // 4. Projects
  const handleSaveProject = (projectData: Partial<Project>) => {
    if (editingProject) {
      const updated = projects.map((p) =>
        p.id === editingProject.id ? { ...p, ...projectData, updated_at: new Date().toISOString() } : p
      );
      applyStateUpdate(pillars, visions, goals, updated, tasks);
    } else {
      const targetGoalId = projectData.goal_id || currentGoal?.id || (goals[0]?.id) || 'goal-1';
      const today = new Date().toISOString().split('T')[0];
      const newP: Project = {
        id: `proj-${Date.now()}`,
        goal_id: targetGoalId,
        title: projectData.title || 'مشروع جديد',
        description: projectData.description || '',
        status: projectData.status || 'in_progress',
        progress: 0,
        start_date: projectData.start_date || today,
        due_date: projectData.due_date || today,
        created_at: new Date().toISOString(),
      };
      applyStateUpdate(pillars, visions, goals, [...projects, newP], tasks);
    }
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع وجميع مهامه؟')) return;
    const remainingTasks = tasks.filter((t) => t.project_id !== projectId);
    const remainingProjects = projects.filter((p) => p.id !== projectId);

    applyStateUpdate(pillars, visions, goals, remainingProjects, remainingTasks);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  // 5. Tasks
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      const updated = tasks.map((t) =>
        t.id === editingTask.id ? { ...t, ...taskData, updated_at: new Date().toISOString() } : t
      );
      applyStateUpdate(pillars, visions, goals, projects, updated);
    } else {
      const targetProjectId = taskData.project_id || currentProject?.id || (projects[0]?.id) || 'proj-1';
      const newTask: Task = {
        id: `task-${Date.now()}`,
        project_id: targetProjectId,
        title: taskData.title || 'مهمة جديدة',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
        completed_at: taskData.status === 'done' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      };
      applyStateUpdate(pillars, visions, goals, projects, [...tasks, newTask]);
    }
    setEditingTask(null);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus: Task['status'] = t.status === 'done' ? 'todo' : 'done';
        return {
          ...t,
          status: nextStatus,
          completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    applyStateUpdate(pillars, visions, goals, projects, updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const remainingTasks = tasks.filter((t) => t.id !== taskId);
    applyStateUpdate(pillars, visions, goals, projects, remainingTasks);
  };

  // Direct jumps
  const handleJumpToVision = (visionId: string, pillarId: string) => {
    setSelectedPillarId(pillarId);
    setSelectedVisionId(visionId);
    setSelectedGoalId(null);
    setSelectedProjectId(null);
    setCurrentTab('hierarchy');
  };

  const handleJumpToGoal = (goalId: string, visionId?: string, pillarId?: string) => {
    if (pillarId) setSelectedPillarId(pillarId);
    if (visionId) setSelectedVisionId(visionId);
    setSelectedGoalId(goalId);
    setSelectedProjectId(null);
    setCurrentTab('hierarchy');
  };

  const handleJumpToProject = (projectId: string, goalId?: string) => {
    const proj = projects.find((p) => p.id === projectId);
    const targetGoalId = goalId || proj?.goal_id;
    const targetGoal = goals.find((g) => g.id === targetGoalId);
    if (targetGoal) {
      setSelectedPillarId(targetGoal.pillar_id);
      if (targetGoal.vision_id) setSelectedVisionId(targetGoal.vision_id);
      setSelectedGoalId(targetGoal.id);
    }
    setSelectedProjectId(projectId);
    setCurrentTab('hierarchy');
  };

  // 5. System Reviews Handlers
  const handleSaveReview = (reviewData: Partial<SystemReview>) => {
    let updated: SystemReview[];
    if (editingReview) {
      updated = reviews.map((r) =>
        r.id === editingReview.id
          ? ({ ...r, ...reviewData, updated_at: new Date().toISOString() } as SystemReview)
          : r
      );
    } else {
      const newRev: SystemReview = {
        id: `rev-${Date.now()}`,
        frequency: reviewData.frequency || 'daily',
        date: reviewData.date || new Date().toISOString().split('T')[0],
        title: reviewData.title || 'مراجعة دورية',
        rating: reviewData.rating || 8,
        focus_pillar_id: reviewData.focus_pillar_id || null,
        wins: reviewData.wins || '',
        challenges: reviewData.challenges || '',
        lessons: reviewData.lessons || '',
        next_commitments: reviewData.next_commitments || '',
        notes: reviewData.notes || '',
        snapshot:
          reviewData.snapshot ||
          generateSystemSnapshot(
            pillars,
            visions,
            goals,
            projects,
            tasks,
            reviewData.focus_pillar_id
          ),
        system_health_score: reviewData.system_health_score || 80,
        smart_summary: reviewData.smart_summary || '',
        strengths: reviewData.strengths || [],
        bottlenecks: reviewData.bottlenecks || [],
        recommendations: reviewData.recommendations || [],
        action_items: reviewData.action_items || [],
        created_at: new Date().toISOString(),
      };
      updated = [newRev, ...reviews];
    }
    setReviews(updated);
    saveReviewsState(updated);
    setIsReviewModalOpen(false);
    setEditingReview(null);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المراجعة؟')) return;
    const updated = reviews.filter((r) => r.id !== reviewId);
    setReviews(updated);
    saveReviewsState(updated);
  };

  const handleConvertActionToTask = (actionItem: ReviewActionItem, reviewId: string) => {
    const targetProjectId = actionItem.project_id || projects[0]?.id;
    if (!targetProjectId) {
      alert('يرجى إنشاء مشروع أولاً لإسناد المهمة إليه.');
      return;
    }

    // 1. Create a real task in the target project
    const newTask: Task = {
      id: `task-${Date.now()}`,
      project_id: targetProjectId,
      title: actionItem.title,
      description: 'مهمة مستخلصة تلقائياً من جلسة المراجعة الدورية والتدقيق التحليلي',
      status: 'todo',
      priority: actionItem.priority || 'medium',
      due_date: new Date().toISOString().split('T')[0],
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...tasks];
    applyStateUpdate(pillars, visions, goals, projects, updatedTasks);

    // 2. Mark action item as converted in reviews
    const updatedReviews = reviews.map((r) => {
      if (r.id === reviewId) {
        return {
          ...r,
          action_items: r.action_items.map((ai) =>
            ai.id === actionItem.id ? { ...ai, is_converted: true } : ai
          ),
        };
      }
      return r;
    });
    setReviews(updatedReviews);
    saveReviewsState(updatedReviews);
  };

  const handleStartPillarReview = (pillarId: string) => {
    setDefaultReviewFrequency('weekly');
    setEditingReview(null);
    setIsReviewModalOpen(true);
  };

  // --- GTD INBOX HANDLERS ---
  const handleAddInboxItem = (data: Partial<InboxItem>) => {
    const newItem: InboxItem = {
      id: `inbox-${Date.now()}`,
      title: data.title || '',
      content: data.content || '',
      source_type: data.source_type || 'idea',
      url: data.url,
      status: 'inbox',
      created_at: new Date().toISOString(),
    };
    const updated = [newItem, ...inboxItems];
    setInboxItems(updated);
    saveInboxState(updated);
  };

  const handleDeleteInboxItem = (id: string) => {
    const updated = inboxItems.filter(i => i.id !== id);
    setInboxItems(updated);
    saveInboxState(updated);
  };

  const handleConvertInboxToTask = (item: InboxItem, targetProjectId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      project_id: targetProjectId,
      title: item.title,
      description: item.content || (item.url ? `الرابط المرجعي: ${item.url}` : ''),
      status: 'todo',
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...tasks];
    applyStateUpdate(pillars, visions, goals, projects, updatedTasks);

    const updatedInbox = inboxItems.map(i => 
      i.id === item.id 
        ? { ...i, status: 'processed' as const, converted_to: 'task' as const, converted_entity_id: newTask.id }
        : i
    );
    setInboxItems(updatedInbox);
    saveInboxState(updatedInbox);
  };

  const handleConvertInboxToVault = (item: InboxItem, targetPillarId: string) => {
    const newVault: VaultItem = {
      id: `vault-${Date.now()}`,
      title: item.title,
      vault_type: item.url ? 'resources' : 'notes',
      pillar_id: targetPillarId,
      url: item.url,
      summary: item.content ? item.content.slice(0, 100) : '',
      content: item.content || '',
      tags: ['مستخلص من الوارد'],
      rating: 5,
      created_at: new Date().toISOString(),
    };

    const updatedVaults = [newVault, ...vaults];
    setVaults(updatedVaults);
    saveVaultsState(updatedVaults);

    const updatedInbox = inboxItems.map(i => 
      i.id === item.id 
        ? { ...i, status: 'processed' as const, converted_to: 'vault' as const, converted_entity_id: newVault.id }
        : i
    );
    setInboxItems(updatedInbox);
    saveInboxState(updatedInbox);
  };

  const handleConvertInboxToHabit = (item: InboxItem, targetPillarId: string) => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: item.title,
      description: item.content || '',
      pillar_id: targetPillarId,
      frequency: 'daily',
      target_days_per_week: 7,
      completed_dates: [],
      current_streak: 0,
      longest_streak: 0,
      best_streak: 0,
      is_active: true,
      time_of_day: 'morning',
      created_at: new Date().toISOString(),
    };

    const updatedHabits = [newHabit, ...habits];
    setHabits(updatedHabits);
    saveHabitsState(updatedHabits);

    const updatedInbox = inboxItems.map(i => 
      i.id === item.id 
        ? { ...i, status: 'processed' as const, converted_to: 'habit' as const, converted_entity_id: newHabit.id }
        : i
    );
    setInboxItems(updatedInbox);
    saveInboxState(updatedInbox);
  };

  // --- HABITS HANDLERS ---
  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const alreadyDone = h.completed_dates.includes(dateStr);
      const newDates = alreadyDone
        ? h.completed_dates.filter(d => d !== dateStr)
        : [...h.completed_dates, dateStr];

      // Simple streak calculator
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        if (newDates.includes(iso)) {
          streak++;
        } else if (i === 0) {
          // If today isn't done yet, check yesterday
          continue;
        } else {
          break;
        }
      }

      const best = Math.max(h.longest_streak || h.best_streak || 0, streak);

      return {
        ...h,
        completed_dates: newDates,
        current_streak: streak,
        longest_streak: best,
        best_streak: best,
      };
    });

    setHabits(updated);
    saveHabitsState(updated);
  };

  const handleSaveHabit = (data: Partial<Habit>) => {
    let updated: Habit[];
    if (data.id) {
      updated = habits.map(h => h.id === data.id ? { ...h, ...data } as Habit : h);
    } else {
      const newHabit: Habit = {
        id: `habit-${Date.now()}`,
        title: data.title || '',
        description: data.description || '',
        pillar_id: data.pillar_id || pillars[0]?.id || '',
        frequency: data.frequency || 'daily',
        target_days_per_week: data.target_days_per_week || 7,
        completed_dates: [],
        current_streak: 0,
        longest_streak: 0,
        best_streak: 0,
        is_active: true,
        time_of_day: data.time_of_day || 'morning',
        created_at: new Date().toISOString(),
      };
      updated = [newHabit, ...habits];
    }
    setHabits(updated);
    saveHabitsState(updated);
  };

  const handleDeleteHabit = (habitId: string) => {
    const updated = habits.filter(h => h.id !== habitId);
    setHabits(updated);
    saveHabitsState(updated);
  };

  // --- VAULTS HANDLERS ---
  const handleSaveVaultItem = (data: Partial<VaultItem>) => {
    let updated: VaultItem[];
    if (data.id) {
      updated = vaults.map(v => v.id === data.id ? { ...v, ...data } as VaultItem : v);
    } else {
      const newItem: VaultItem = {
        id: `vault-${Date.now()}`,
        title: data.title || '',
        vault_type: data.vault_type || 'notes',
        pillar_id: data.pillar_id || pillars[0]?.id || '',
        project_id: data.project_id || null,
        author_or_source: data.author_or_source,
        url: data.url,
        summary: data.summary || '',
        content: data.content || '',
        tags: data.tags || [],
        rating: data.rating || 5,
        created_at: new Date().toISOString(),
      };
      updated = [newItem, ...vaults];
    }
    setVaults(updated);
    saveVaultsState(updated);
  };

  const handleDeleteVaultItem = (vaultId: string) => {
    const updated = vaults.filter(v => v.id !== vaultId);
    setVaults(updated);
    saveVaultsState(updated);
  };

  // Reset to initial seed
  const handleResetData = () => {
    if (confirm('هل تريد استعادة البيانات الافتراضية؟')) {
      localStorage.clear();
      const loaded = loadHierarchicalState();
      setPillars(loaded.pillars);
      setVisions(loaded.visions);
      setGoals(loaded.goals);
      setProjects(loaded.projects);
      setTasks(loaded.tasks);
      const revs = loadReviewsState(
        loaded.pillars,
        loaded.visions,
        loaded.goals,
        loaded.projects,
        loaded.tasks
      );
      setReviews(revs);

      const { inbox, habits: loadedHabits, vaults: loadedVaults } = loadPPVState(loaded.pillars);
      setInboxItems(inbox);
      setHabits(loadedHabits);
      setVaults(loadedVaults);

      setSelectedPillarId(null);
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
      setCurrentTab('hierarchy');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1a2420] flex font-sans antialiased selection:bg-[#174235] selection:text-white" dir="rtl">
      
      {/* 1. SIDEBAR NAVIGATION styled like Dawenli OS */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        counts={{
          pillars: pillars.length,
          visions: visions.length,
          goals: goals.length,
          projects: projects.length,
          tasks: tasks.length,
          reviews: reviews.length,
          inbox: inboxItems.filter(i => i.status === 'inbox').length,
          habits: habits.length,
          vaults: vaults.length,
          focus: focusSessions.length,
          timeBlocks: timeBlocks.filter(b => b.date === new Date().toISOString().split('T')[0]).length,
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top App Header matching the clean header of screenshot 2 */}
        <header className="bg-white border-b border-[#e8e5de] px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            
            {/* Left section: mobile hamburger & breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 text-[#65736b] hover:text-[#1a2420] rounded-xl hover:bg-[#f2efe8] cursor-pointer"
                title="القائمة الجانبية"
              >
                <Menu className="w-5 h-5" />
              </button>

              {currentTab === 'hierarchy' ? (
                <div className="overflow-x-auto py-0.5 max-w-xl">
                  <Breadcrumbs items={breadcrumbItems} onNavigate={handleBreadcrumbClick} />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#6e7b74]">
                  <span className="font-normal text-[#85928a]">دَوّنـلي</span>
                  <span className="text-[#c2bcaf]">/</span>
                  <span className="font-semibold text-[#1a2420]">
                    {currentTab === 'inbox' && 'صندوق الوارد (GTD Inbox)'}
                    {currentTab === 'focus' && 'جلسات التركيز (Pomodoro & Flowtime)'}
                    {currentTab === 'timeblocking' && 'حجب الوقت اليومي (Time Blocking)'}
                    {currentTab === 'habits' && 'متتبع العادات (Habits)'}
                    {currentTab === 'vaults' && 'خزائن المعرفة (Vaults)'}
                    {currentTab === 'pillars' && 'الركائز الأساسية'}
                    {currentTab === 'visions' && 'الرؤى المستقبلية'}
                    {currentTab === 'goals' && 'أهداف القيمة'}
                    {currentTab === 'projects' && 'المشروعات التنفيذية'}
                    {currentTab === 'tasks' && 'المهام اليومية'}
                    {currentTab === 'reviews' && 'المراجعات الدورية'}
                  </span>
                </div>
              )}
            </div>

            {/* Right section: Quick Add button and utility actions */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* PRIMARY ACTION BUTTON: Deep Forest Green matching Dawenli */}
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-[#174235] hover:bg-[#12352a] text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                title="إضافة سريعة موحدة (مهمة، مشروع، هدف، رؤية، ركيزة)"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">إضافة سريعة</span>
              </button>

              {/* SQL Schema button */}
              <button
                onClick={() => setIsSqlModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#f8f7f4] hover:bg-[#edeae2] text-[#404c45] rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#e2ddd5]"
                title="عرض مخطط SQL وتريجرات الحساب التلقائي لـ Supabase"
              >
                <Database className="w-3.5 h-3.5 text-[#174235]" />
                <span>مخطط SQL</span>
              </button>

              {/* Reset seed data button */}
              <button
                onClick={handleResetData}
                className="p-2 text-[#7d8982] hover:text-[#1a2420] hover:bg-[#f2efe8] rounded-xl transition-colors cursor-pointer"
                title="استعادة البيانات الأولية"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

            </div>

          </div>
        </header>

        {/* Main Body View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* TAB 1: DRILL-DOWN HIERARCHY */}
            {currentTab === 'hierarchy' && (
              <>
                {/* 1. Level 5: Task View inside Project */}
                {selectedProjectId && currentProject ? (
                  <ProjectDetailView
                    pillar={currentPillar || pillars[0]}
                    goal={currentGoal || goals[0]}
                    project={currentProject}
                    tasks={tasks.filter((t) => t.project_id === currentProject.id)}
                    onToggleTaskStatus={handleToggleTaskStatus}
                    onNewTask={() => {
                      setEditingTask(null);
                      setIsTaskModalOpen(true);
                    }}
                    onEditTask={(task) => {
                      setEditingTask(task);
                      setIsTaskModalOpen(true);
                    }}
                    onDeleteTask={handleDeleteTask}
                    onEditProject={(proj) => {
                      setEditingProject(proj);
                      setIsProjectModalOpen(true);
                    }}
                  />
                ) : selectedGoalId && currentGoal ? (
                  /* 2. Level 4: Project View inside ValueGoal */
                  <ValueGoalDetailView
                    pillar={currentPillar || pillars[0]}
                    vision={currentVision || undefined}
                    goal={currentGoal}
                    projects={projects.filter((p) => p.goal_id === currentGoal.id)}
                    onSelectProject={(pId) => setSelectedProjectId(pId)}
                    onNewProject={() => {
                      setEditingProject(null);
                      setIsProjectModalOpen(true);
                    }}
                    onEditProject={(proj) => {
                      setEditingProject(proj);
                      setIsProjectModalOpen(true);
                    }}
                    onDeleteProject={handleDeleteProject}
                    onEditGoal={(g) => {
                      setEditingGoal(g);
                      setIsGoalModalOpen(true);
                    }}
                  />
                ) : selectedVisionId && currentVision ? (
                  /* 3. Level 3: ValueGoal View inside Vision */
                  <VisionDetailView
                    pillar={currentPillar || pillars[0]}
                    vision={currentVision}
                    valueGoals={goals.filter((g) => g.vision_id === currentVision.id || (g.pillar_id === currentVision.pillar_id && !g.vision_id))}
                    onSelectGoal={(gId) => setSelectedGoalId(gId)}
                    onNewGoal={() => {
                      setEditingGoal(null);
                      setIsGoalModalOpen(true);
                    }}
                    onEditGoal={(g) => {
                      setEditingGoal(g);
                      setIsGoalModalOpen(true);
                    }}
                    onDeleteGoal={handleDeleteGoal}
                    onEditVision={(v) => {
                      setEditingVision(v);
                      setIsVisionModalOpen(true);
                    }}
                  />
                ) : selectedPillarId && currentPillar ? (
                  /* 4. Level 2: Vision View inside Pillar */
                  <PillarDetailView
                    pillar={currentPillar}
                    visions={visions.filter((v) => v.pillar_id === currentPillar.id)}
                    onSelectVision={(vId) => setSelectedVisionId(vId)}
                    onNewVision={() => {
                      setEditingVision(null);
                      setIsVisionModalOpen(true);
                    }}
                    onEditVision={(v) => {
                      setEditingVision(v);
                      setIsVisionModalOpen(true);
                    }}
                    onDeleteVision={handleDeleteVision}
                    onEditPillar={(p) => {
                      setEditingPillar(p);
                      setIsPillarModalOpen(true);
                    }}
                    onStartPillarReview={handleStartPillarReview}
                  />
                ) : (
                  /* 5. Level 1: Root Pillars List */
                  <PillarsListView
                    pillars={pillars}
                    tasks={tasks}
                    projects={projects}
                    goals={goals}
                    onSelectPillar={(pillarId) => setSelectedPillarId(pillarId)}
                    onNewPillar={() => {
                      setEditingPillar(null);
                      setIsPillarModalOpen(true);
                    }}
                    onEditPillar={(pillar) => {
                      setEditingPillar(pillar);
                      setIsPillarModalOpen(true);
                    }}
                    onDeletePillar={handleDeletePillar}
                    onOpenSqlModal={() => setIsSqlModalOpen(true)}
                    onStartFocus={handleStartFocus}
                    onCompleteTask={handleToggleTaskStatus}
                    onOpenTimeBlocking={() => setCurrentTab('timeblocking')}
                    onSelectProject={handleJumpToProject}
                  />
                )}
              </>
            )}

            {/* TAB 2: PILLARS TAB */}
            {currentTab === 'pillars' && (
              <PillarsListView
                pillars={pillars}
                onSelectPillar={(pillarId) => {
                  setSelectedPillarId(pillarId);
                  setSelectedVisionId(null);
                  setSelectedGoalId(null);
                  setSelectedProjectId(null);
                  setCurrentTab('hierarchy');
                }}
                onNewPillar={() => {
                  setEditingPillar(null);
                  setIsPillarModalOpen(true);
                }}
                onEditPillar={(pillar) => {
                  setEditingPillar(pillar);
                  setIsPillarModalOpen(true);
                }}
                onDeletePillar={handleDeletePillar}
                onOpenSqlModal={() => setIsSqlModalOpen(true)}
              />
            )}

            {/* TAB 3: VISIONS TAB */}
            {currentTab === 'visions' && (
              <VisionsTabView
                visions={visions}
                pillars={pillars}
                onSelectVision={handleJumpToVision}
                onNewVision={() => {
                  setEditingVision(null);
                  setIsVisionModalOpen(true);
                }}
                onEditVision={(vision) => {
                  setEditingVision(vision);
                  setIsVisionModalOpen(true);
                }}
                onDeleteVision={handleDeleteVision}
              />
            )}

            {/* TAB 4: GOALS TAB */}
            {currentTab === 'goals' && (
              <GoalsTabView
                goals={goals}
                visions={visions}
                pillars={pillars}
                onSelectGoal={handleJumpToGoal}
                onNewGoal={() => {
                  setEditingGoal(null);
                  setIsGoalModalOpen(true);
                }}
                onEditGoal={(goal) => {
                  setEditingGoal(goal);
                  setIsGoalModalOpen(true);
                }}
                onDeleteGoal={handleDeleteGoal}
              />
            )}

            {/* TAB 5: PROJECTS TAB */}
            {currentTab === 'projects' && (
              <ProjectsTabView
                projects={projects}
                goals={goals}
                tasks={tasks}
                onSelectProject={handleJumpToProject}
                onNewProject={() => {
                  setEditingProject(null);
                  setIsProjectModalOpen(true);
                }}
                onEditProject={(proj) => {
                  setEditingProject(proj);
                  setIsProjectModalOpen(true);
                }}
                onDeleteProject={handleDeleteProject}
              />
            )}

            {/* TAB 6: TASKS TAB */}
            {currentTab === 'tasks' && (
              <TasksTabView
                tasks={tasks}
                projects={projects}
                onToggleStatus={handleToggleTaskStatus}
                onNewTask={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setIsTaskModalOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                onSelectProject={(pId) => handleJumpToProject(pId, projects.find(p => p.id === pId)?.goal_id || '')}
                onStartFocus={handleStartFocus}
              />
            )}

            {/* TAB 7: REVIEWS TAB (نظام المراجعة الشامل والتشخيص الذكي) */}
            {currentTab === 'reviews' && (
              <ReviewsTabView
                reviews={reviews}
                pillars={pillars}
                visions={visions}
                goals={goals}
                projects={projects}
                tasks={tasks}
                onNewReview={(freq) => {
                  setDefaultReviewFrequency(freq || 'daily');
                  setEditingReview(null);
                  setIsReviewModalOpen(true);
                }}
                onEditReview={(review) => {
                  setEditingReview(review);
                  setIsReviewModalOpen(true);
                }}
                onDeleteReview={handleDeleteReview}
                onConvertActionToTask={handleConvertActionToTask}
              />
            )}

            {/* TAB 8: GTD INBOX TAB (صندوق الوارد والالتقاط السريع والتوضيح) */}
            {currentTab === 'inbox' && (
              <InboxTabView
                inboxItems={inboxItems}
                pillars={pillars}
                projects={projects}
                goals={goals}
                onAddInboxItem={handleAddInboxItem}
                onDeleteItem={handleDeleteInboxItem}
                onConvertToTask={handleConvertInboxToTask}
                onConvertToVault={handleConvertInboxToVault}
                onConvertToHabit={handleConvertInboxToHabit}
              />
            )}

            {/* TAB 9: PPV HABITS TRACKER TAB (متتبع العادات والهويات) */}
            {currentTab === 'habits' && (
              <HabitsTabView
                habits={habits}
                pillars={pillars}
                onToggleHabitDate={handleToggleHabitDate}
                onSaveHabit={handleSaveHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            )}

            {/* TAB 10: PPV KNOWLEDGE VAULTS TAB (خزائن المعرفة والمراجع) */}
            {currentTab === 'vaults' && (
              <VaultsTabView
                vaults={vaults}
                pillars={pillars}
                projects={projects}
                onSaveVaultItem={handleSaveVaultItem}
                onDeleteVaultItem={handleDeleteVaultItem}
              />
            )}

            {/* TAB 11: FOCUS SESSIONS TAB (جلسات التركيز: بومودورو و Flowtime) */}
            {currentTab === 'focus' && (
              <FocusSessionView
                tasks={tasks}
                projects={projects}
                pillars={pillars}
                initialTask={activeFocusTask}
                onToggleTaskStatus={handleToggleTaskStatus}
                onSaveSession={handleSaveFocusSession}
                sessionsHistory={focusSessions}
                onOpenTimeBlocking={() => setCurrentTab('timeblocking')}
                onBackToHierarchy={() => setCurrentTab('hierarchy')}
              />
            )}

            {/* TAB 12: TIME BLOCKING TAB (حجب الوقت وجدولة اليوم) */}
            {currentTab === 'timeblocking' && (
              <TimeBlockingView
                tasks={tasks}
                projects={projects}
                pillars={pillars}
                timeBlocks={timeBlocks}
                onSaveTimeBlock={handleSaveTimeBlock}
                onDeleteTimeBlock={handleDeleteTimeBlock}
                onToggleTimeBlockStatus={handleToggleTimeBlockStatus}
                onStartFocusOnTask={handleStartFocus}
              />
            )}

          </div>
        </main>
      </div>

      {/* 3. MODALS */}

      {/* Review Modal (Manual Reflection & Automated Smart Audit) */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setEditingReview(null);
        }}
        onSaveReview={handleSaveReview}
        initialReview={editingReview}
        defaultFrequency={defaultReviewFrequency}
        pillars={pillars}
        visions={visions}
        goals={goals}
        projects={projects}
        tasks={tasks}
      />

      {/* Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        pillars={pillars}
        visions={visions}
        goals={goals}
        projects={projects}
        onAddTask={handleSaveTask}
        onAddProject={handleSaveProject}
        onAddGoal={handleSaveGoal}
        onAddVision={handleSaveVision}
        onAddPillar={handleSavePillar}
        onAddInboxItem={handleAddInboxItem}
      />

      {/* Pillar Modal */}
      <PillarModal
        isOpen={isPillarModalOpen}
        onClose={() => {
          setIsPillarModalOpen(false);
          setEditingPillar(null);
        }}
        onSave={handleSavePillar}
        initialPillar={editingPillar}
      />

      {/* Vision Modal */}
      <VisionModal
        isOpen={isVisionModalOpen}
        onClose={() => {
          setIsVisionModalOpen(false);
          setEditingVision(null);
        }}
        onSave={handleSaveVision}
        initialVision={editingVision}
        pillarTitle={currentPillar?.title}
        pillars={pillars}
      />

      {/* Value Goal Modal */}
      <ValueGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        initialGoal={editingGoal}
        parentTitle={currentVision?.title || currentPillar?.title}
        visions={visions}
        pillars={pillars}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
        goalTitle={currentGoal?.title}
        goals={goals}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        projectTitle={currentProject?.title}
        projects={projects}
      />

      {/* Supabase SQL Schema Modal */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

    </div>
  );
};
