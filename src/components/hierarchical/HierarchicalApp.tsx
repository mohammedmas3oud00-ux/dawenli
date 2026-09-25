import React, { lazy, useState, useEffect, useRef } from 'react';
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
  TimeBlock,
  CustomFieldDefinition,
  AppDataSnapshot,
  WorshipDefinition,
  WorshipLog,
  ProgressionPath,
  QuranKhatma,
  QuranHifzTracker,
  SleepSchedule
} from '../../types/hierarchical';
import { 
  recalculateAllHierarchicalProgress
} from '../../utils/hierarchicalStore';
import { generateSystemSnapshot } from '../../utils/reviewEngine';

import { Breadcrumbs } from './Breadcrumbs';
import { Sidebar } from './Sidebar';
const PillarsListView = lazy(() => import('./PillarsListView').then((module) => ({ default: module.PillarsListView })));
const PillarDetailView = lazy(() => import('./PillarDetailView').then((module) => ({ default: module.PillarDetailView })));
const VisionDetailView = lazy(() => import('./VisionDetailView').then((module) => ({ default: module.VisionDetailView })));
const ValueGoalDetailView = lazy(() => import('./ValueGoalDetailView').then((module) => ({ default: module.ValueGoalDetailView })));
const ProjectDetailView = lazy(() => import('./ProjectDetailView').then((module) => ({ default: module.ProjectDetailView })));
const VisionsTabView = lazy(() => import('./VisionsTabView').then((module) => ({ default: module.VisionsTabView })));
const GoalsTabView = lazy(() => import('./GoalsTabView').then((module) => ({ default: module.GoalsTabView })));
const ProjectsTabView = lazy(() => import('./ProjectsTabView').then((module) => ({ default: module.ProjectsTabView })));
const TasksTabView = lazy(() => import('./TasksTabView').then((module) => ({ default: module.TasksTabView })));
const ReviewsTabView = lazy(() => import('./ReviewsTabView').then((module) => ({ default: module.ReviewsTabView })));
const ReviewModal = lazy(() => import('./ReviewModal').then((module) => ({ default: module.ReviewModal })));
const InboxTabView = lazy(() => import('./InboxTabView').then((module) => ({ default: module.InboxTabView })));
const HabitsTabView = lazy(() => import('./HabitsTabView').then((module) => ({ default: module.HabitsTabView })));
const VaultsTabView = lazy(() => import('./VaultsTabView').then((module) => ({ default: module.VaultsTabView })));
const FocusSessionView = lazy(() => import('./FocusSessionView').then((module) => ({ default: module.FocusSessionView })));
const TimeBlockingView = lazy(() => import('./TimeBlockingView').then((module) => ({ default: module.TimeBlockingView })));
const IbadatDashboard = lazy(() => import('./IbadatDashboard').then((module) => ({ default: module.IbadatDashboard })));
const entityModals = () => import('./EntityFormModals');
const PillarModal = lazy(() => entityModals().then((module) => ({ default: module.PillarModal })));
const VisionModal = lazy(() => entityModals().then((module) => ({ default: module.VisionModal })));
const ValueGoalModal = lazy(() => entityModals().then((module) => ({ default: module.ValueGoalModal })));
const ProjectModal = lazy(() => entityModals().then((module) => ({ default: module.ProjectModal })));
const TaskModal = lazy(() => entityModals().then((module) => ({ default: module.TaskModal })));
const QuickAddModal = lazy(() => import('./QuickAddModal').then((module) => ({ default: module.QuickAddModal })));
const VoiceAiCaptureModal = lazy(() => import('./VoiceAiCaptureModal').then((module) => ({ default: module.VoiceAiCaptureModal })));
import { AuthModal } from './AuthModal';
import { InstallAppButton } from './InstallAppButton';
import { ToastContainer, ToastMessage } from './ToastNotification';
import { Plus, Menu, Mic, Sparkles, Sun, Moon, User, LogIn, LogOut, KeyRound, Trash2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';
import { createSnapshotBackup, DataRepository, emptySnapshot, GuestLocalRepository, normalizeSnapshot, SupabaseRepository } from '../../data/repository';
import { remapSnapshotIds } from '../../data/legacyMigration';
import { createId } from '../../utils/id';
import { toLocalDateKey } from '../../utils/date';
import { calculateHabitStreak } from '../../utils/habitStreak';
import { deleteGeminiCredential, hasStoredGeminiCredential, refreshGeminiCredentialStatus, saveGeminiCredential } from '../../utils/aiCredentials';
import { subscribeToPush } from '../../utils/pushNotifications';

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
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [worshipDefinitions, setWorshipDefinitions] = useState<WorshipDefinition[]>([]);
  const [worshipLogs, setWorshipLogs] = useState<WorshipLog[]>([]);
  const [progressionPaths, setProgressionPaths] = useState<ProgressionPath[]>([]);
  const [quranKhatmas, setQuranKhatmas] = useState<QuranKhatma[]>([]);
  const [quranHifzTrackers, setQuranHifzTrackers] = useState<QuranHifzTracker[]>([]);
  const [sleepSchedules, setSleepSchedules] = useState<SleepSchedule[]>([]);
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
  const [isVoiceAiModalOpen, setIsVoiceAiModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<{ id?: string; email: string; isGuest?: boolean } | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'signedOut' | 'guest' | 'authenticated'>('loading');
  const [dataReady, setDataReady] = useState(false);
  const repositoryRef = useRef<DataRepository | null>(null);
  const lastSavedSnapshotRef = useRef<AppDataSnapshot>(emptySnapshot());
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const queueSnapshotSave = (repository: DataRepository, snapshot: AppDataSnapshot) => {
    saveQueueRef.current = saveQueueRef.current.catch(() => undefined).then(() => repository.save(snapshot)).then(() => {
      lastSavedSnapshotRef.current = snapshot;
    });
    return saveQueueRef.current;
  };

  // Supabase Auth Session Synchronization
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthStatus('signedOut');
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active) return;
      if (error || !session?.user?.email) {
        setCurrentUser(null);
        setAuthStatus('signedOut');
        return;
      }
      setCurrentUser({ id: session.user.id, email: session.user.email });
      setAuthStatus('authenticated');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user?.email) {
        setCurrentUser({ id: session.user.id, email: session.user.email });
        setAuthStatus('authenticated');
      } else {
        setCurrentUser(null);
        setAuthStatus('signedOut');
        setDataReady(false);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // Dark Mode Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dawenli_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dawenli_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dawenli_theme', 'light');
    }
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark((prev) => !prev);
  };

  const handleAuthSuccess = (user: { id?: string; email: string; isGuest?: boolean }) => {
    setCurrentUser(user);
    setAuthStatus(user.isGuest ? 'guest' : 'authenticated');
    setIsAuthModalOpen(false);
    setToasts((prev) => [
      ...prev,
      {
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'تم تسجيل الدخول بنجاح',
        description: `مرحباً بك مجدداً ${user.email}`,
      },
    ]);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }
    setCurrentUser(null);
    setAuthStatus('signedOut');
    setDataReady(false);
    setIsAuthModalOpen(true);
    setToasts((prev) => [
      ...prev,
      {
        id: `toast-${Date.now()}`,
        type: 'info',
        title: 'تسجيل الخروج',
        description: 'تم تسجيل الخروج بنجاح. يرجى تسجيل الدخول للوصول إلى المنظومة.',
      },
    ]);
  };

  const handleAdhanNotify = (prayerName: string) => {
    // 1. In-app Toast Notification
    setToasts((prev) => [
      ...prev,
      {
        id: `toast-${Date.now()}`,
        type: 'info',
        title: 'حان الآن موعد الأذان 🕌',
        description: `حان الآن موعد أذان ${prayerName} وفق توقيتك المحلي. حيّ على الصلاة، حيّ على الفلاح.`,
      },
    ]);

    // 2. Browser System Notification
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('حان الآن موعد الأذان 🕌', {
            body: `حان الآن موعد أذان ${prayerName} وفق توقيتك المحلي. حيّ على الصلاة، حيّ على الفلاح.`,
            dir: 'rtl',
            lang: 'ar',
          });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    } catch {}
  };

  // Review Modals State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<SystemReview | null>(null);
  const [defaultReviewFrequency, setDefaultReviewFrequency] = useState<ReviewFrequency>('daily');
  const [defaultReviewPillarId, setDefaultReviewPillarId] = useState<string | null>(null);

  const [isPillarModalOpen, setIsPillarModalOpen] = useState(false);
  const [editingPillar, setEditingPillar] = useState<Pillar | null>(null);

  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [editingVision, setEditingVision] = useState<Vision | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ValueGoal | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectDefaults, setNewProjectDefaults] = useState<Partial<Project> | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string | null>(null);

  const applySnapshot = (snapshot: AppDataSnapshot) => {
    const calculated = recalculateAllHierarchicalProgress(snapshot.pillars, snapshot.visions, snapshot.goals, snapshot.projects, snapshot.tasks);
    setPillars(calculated.pillars);
    setVisions(calculated.visions);
    setGoals(calculated.goals);
    setProjects(calculated.projects);
    setTasks(calculated.tasks);
    setReviews(snapshot.reviews);
    setInboxItems(snapshot.inboxItems);
    setHabits(snapshot.habits);
    setVaults(snapshot.vaults);
    setFocusSessions(snapshot.focusSessions);
    setTimeBlocks(snapshot.timeBlocks);
    setCustomFieldDefinitions(snapshot.customFieldDefinitions);
    setWorshipDefinitions(snapshot.worshipDefinitions);
    setWorshipLogs(snapshot.worshipLogs);
    setProgressionPaths(snapshot.progressionPaths);
    setQuranKhatmas(snapshot.quranKhatmas);
    setQuranHifzTrackers(snapshot.quranHifzTrackers);
    setSleepSchedules(snapshot.sleepSchedules);
  };

  const handleConfigureAiKey = async (): Promise<boolean> => {
    if (currentUser?.isGuest || authStatus !== 'authenticated') {
      alert('ميزات Gemini متاحة للحسابات المسجلة فقط.');
      return false;
    }
    const alreadyConfigured = await refreshGeminiCredentialStatus().catch(() => false);
    const entered = window.prompt(alreadyConfigured
      ? 'أدخل مفتاح Gemini جديدًا لاستبدال المفتاح المحفوظ، أو اترك الحقل فارغًا للاحتفاظ بالحالي.'
      : 'أدخل مفتاح Gemini. سيُشفّر ويُحفظ لخزينة حسابك ولا يظهر كاملًا مرة أخرى.');
    if (entered === null) return alreadyConfigured;
    if (!entered.trim()) {
      return alreadyConfigured;
    }
    try {
      await saveGeminiCredential(entered);
      setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم حفظ Gemini بأمان', description: 'المفتاح مشفّر ومربوط بحسابك فقط.' }]);
      return true;
    } catch (error) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر حفظ مفتاح Gemini', description: error instanceof Error ? error.message : 'حاول مرة أخرى.' }]);
      return false;
    }
  };

  const handleDeleteAiKey = async () => {
    if (!confirm('حذف مفتاح Gemini من هذا الحساب؟')) return;
    try {
      await deleteGeminiCredential();
      setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم حذف مفتاح Gemini', description: 'لن تعمل ميزات الذكاء حتى تضيف مفتاحًا جديدًا.' }]);
    } catch (error) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر حذف مفتاح Gemini', description: error instanceof Error ? error.message : 'حاول مرة أخرى.' }]);
    }
  };

  const handleOpenVoiceAi = async () => {
    const configured = hasStoredGeminiCredential() || await refreshGeminiCredentialStatus().catch(() => false);
    if ((configured || await handleConfigureAiKey()) && authStatus === 'authenticated') {
      setIsVoiceAiModalOpen(true);
    }
  };

  // Select exactly one repository per session. Signed-in data never falls back to local storage.
  useEffect(() => {
    if (!currentUser || authStatus === 'loading' || authStatus === 'signedOut') return;
    const repository = currentUser.isGuest
      ? new GuestLocalRepository()
      : currentUser.id && supabase
        ? new SupabaseRepository(supabase, currentUser.id)
        : null;
    if (!repository) {
      setAuthStatus('signedOut');
      setCurrentUser(null);
      return;
    }
    repositoryRef.current = repository;
    setDataReady(false);
    let active = true;
    repository.load().then(async (loadedSnapshot) => {
      if (!active) return;
      let snapshot = loadedSnapshot;
      // Cloud accounts are intentionally isolated from legacy local storage.
      // Legacy import/export, if reintroduced, must be an explicit account action.
      applySnapshot(snapshot);
      lastSavedSnapshotRef.current = snapshot;
      setDataReady(true);
    }).catch((error: unknown) => {
      if (!active) return;
      setToasts((previous) => [...previous, { id: createId(), type: 'warning', title: 'تعذر تحميل البيانات', description: error instanceof Error ? error.message : 'خطأ غير معروف' }]);
    });
    return () => { active = false; };
  }, [currentUser?.id, currentUser?.isGuest, authStatus]);

  useEffect(() => {
    if (!dataReady || !repositoryRef.current) return;
    const snapshot: AppDataSnapshot = {
      schemaVersion: 4,
      pillars, visions, goals, projects, tasks, reviews,
      inboxItems, habits, vaults, focusSessions, timeBlocks,
      customFieldDefinitions,
      worshipDefinitions, worshipLogs, progressionPaths, quranKhatmas, quranHifzTrackers, sleepSchedules,
    };
    const repository = repositoryRef.current;
    const timer = window.setTimeout(() => {
      queueSnapshotSave(repository, snapshot).catch((error: unknown) => {
        setToasts((previous) => [...previous, {
          id: createId(), type: 'error', title: 'فشل الحفظ',
          description: error instanceof Error ? error.message : 'احتفظنا بالتعديلات محليًا مؤقتًا. أعد المحاولة.',
          actionLabel: 'إعادة المحاولة',
          onAction: () => queueSnapshotSave(repository, snapshot).catch(() => undefined),
        }]);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [dataReady, pillars, visions, goals, projects, tasks, reviews, inboxItems, habits, vaults, focusSessions, timeBlocks, customFieldDefinitions, worshipDefinitions, worshipLogs, progressionPaths, quranKhatmas, quranHifzTrackers, sleepSchedules]);

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
  };

  // Active Entities for drill-down context
  const currentPillar = pillars.find((p) => p.id === selectedPillarId) || null;
  const currentVision = visions.find((v) => v.id === selectedVisionId) || null;
  const currentGoal = goals.find((g) => g.id === selectedGoalId) || null;
  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;

  // Breadcrumbs Generator
  const breadcrumbItems: BreadcrumbItem[] = [
    { id: 'root', label: 'الركائز', type: 'root' },
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
    setFocusSessions((previous) => [session, ...previous.filter((item) => item.id !== session.id)]);
  };

  const handleSaveTimeBlock = (block: TimeBlock) => {
    const exists = timeBlocks.some((b) => b.id === block.id);
    const updated = exists
      ? timeBlocks.map((b) => (b.id === block.id ? block : b))
      : [block, ...timeBlocks];
    setTimeBlocks(updated);
  };

  const handleSaveTimeBlocks = (blocks: TimeBlock[]) => {
    setTimeBlocks((previous) => {
      const incomingIds = new Set(blocks.map((block) => block.id));
      return [...blocks, ...previous.filter((block) => !incomingIds.has(block.id))];
    });
  };

  const handleDeleteTimeBlock = (blockId: string) => {
    const updated = timeBlocks.filter((b) => b.id !== blockId);
    setTimeBlocks(updated);
  };

  const handleToggleTimeBlockStatus = (blockId: string) => {
    const updated = timeBlocks.map((b) =>
      b.id === blockId ? { ...b, is_completed: !b.is_completed } : b
    );
    setTimeBlocks(updated);
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
        id: createId(),
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
    setHabits((items) => items.filter((item) => item.pillar_id !== pillarId));
    setVaults((items) => items.filter((item) => item.pillar_id !== pillarId));
    setTimeBlocks((items) => items.filter((item) => item.pillar_id !== pillarId && (!item.project_id || !targetProjectIds.includes(item.project_id))));
    setFocusSessions((items) => items.map((item) => item.task_id && !remainingTasks.some((task) => task.id === item.task_id) ? { ...item, task_id: null } : item));
    setReviews((items) => items.map((item) => item.focus_pillar_id === pillarId ? { ...item, focus_pillar_id: null } : item));
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
      const targetPillarId = visionData.pillar_id || selectedPillarId;
      if (!targetPillarId || !pillars.some((pillar) => pillar.id === targetPillarId)) {
        alert('أنشئ ركيزة أو اختر ركيزة صحيحة أولًا.');
        return;
      }
      const newV: Vision = {
        id: createId(),
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
    setTimeBlocks((items) => items.filter((item) => !item.project_id || !targetProjectIds.includes(item.project_id)));
    setFocusSessions((items) => items.map((item) => item.task_id && !remainingTasks.some((task) => task.id === item.task_id) ? { ...item, task_id: null } : item));
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
      const targetPillarId = goalData.pillar_id || currentVision?.pillar_id || currentPillar?.id;
      if (!targetPillarId || !pillars.some((pillar) => pillar.id === targetPillarId)) {
        alert('أنشئ ركيزة أو اختر ركيزة صحيحة أولًا.');
        return;
      }
      const targetVisionId = currentVision?.id || goalData.vision_id || undefined;
      if (targetVisionId && !visions.some((vision) => vision.id === targetVisionId && vision.pillar_id === targetPillarId)) {
        alert('الرؤية المختارة لا تتبع الركيزة المحددة.');
        return;
      }
      const newG: ValueGoal = {
        id: createId(),
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
    setTimeBlocks((items) => items.filter((item) => !item.project_id || !targetProjectIds.includes(item.project_id)));
    setFocusSessions((items) => items.map((item) => item.task_id && !remainingTasks.some((task) => task.id === item.task_id) ? { ...item, task_id: null } : item));
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
      const targetGoalId = projectData.goal_id || currentGoal?.id;
      if (!targetGoalId || !goals.some((goal) => goal.id === targetGoalId)) {
        alert('أنشئ هدف قيمة أو اختر هدفًا صحيحًا أولًا.');
        return;
      }
      const today = toLocalDateKey();
      const newP: Project = {
        id: createId(),
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
    setVaults((items) => items.map((item) => item.project_id === projectId ? { ...item, project_id: null } : item));
    setTimeBlocks((items) => items.filter((item) => item.project_id !== projectId));
    setFocusSessions((items) => items.map((item) => item.task_id && !remainingTasks.some((task) => task.id === item.task_id) ? { ...item, task_id: null } : item));
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  // 5. Tasks
  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      const updated = tasks.map((t) =>
        t.id === editingTask.id ? { ...t, ...taskData, custom_fields: taskData.custom_fields || t.custom_fields, updated_at: new Date().toISOString() } : t
      );
      applyStateUpdate(pillars, visions, goals, projects, updated);
    } else {
      const targetProjectId = taskData.project_id || currentProject?.id;
      if (!targetProjectId || !projects.some((project) => project.id === targetProjectId)) {
        alert('أنشئ مشروعًا أو اختر مشروعًا صحيحًا أولًا.');
        return;
      }
      const newTask: Task = {
        id: createId(),
        project_id: targetProjectId,
        title: taskData.title || 'مهمة جديدة',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
        completed_at: taskData.status === 'done' ? new Date().toISOString() : null,
        custom_fields: taskData.custom_fields || {},
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

  const handleUpdateTaskStatus = (taskId: string, targetStatus: Task['status']) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: targetStatus,
          completed_at: targetStatus === 'done' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    applyStateUpdate(pillars, visions, goals, projects, updated);
  };

  const handleUpdateTaskCustomFields = (taskId: string, customFields: Record<string, any>) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          custom_fields: customFields,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    applyStateUpdate(pillars, visions, goals, projects, updated);
  };

  const handleUpdateProjectStatus = (projectId: string, targetStatus: Project['status']) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          status: targetStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });
    applyStateUpdate(pillars, visions, goals, updated, tasks);
  };

  const handleUpdateProjectCustomFields = (projectId: string, customFields: Record<string, any>) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          custom_fields: customFields,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });
    applyStateUpdate(pillars, visions, goals, updated, tasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const remainingTasks = tasks.filter((t) => t.id !== taskId);
    applyStateUpdate(pillars, visions, goals, projects, remainingTasks);
    setTimeBlocks((items) => items.map((item) => item.task_id === taskId ? { ...item, task_id: null } : item));
    setFocusSessions((items) => items.map((item) => item.task_id === taskId ? { ...item, task_id: null } : item));
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
    setSelectedVisionId(visionId || null);
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
      setSelectedVisionId(targetGoal.vision_id || null);
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
        id: createId(),
        frequency: reviewData.frequency || 'daily',
        date: reviewData.date || toLocalDateKey(),
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
            reviewData.focus_pillar_id,
            worshipDefinitions,
            worshipLogs
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
    setIsReviewModalOpen(false);
    setEditingReview(null);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المراجعة؟')) return;
    const updated = reviews.filter((r) => r.id !== reviewId);
    setReviews(updated);
  };

  const handleConvertActionToTask = (actionItem: ReviewActionItem, reviewId: string) => {
    const targetProjectId = actionItem.project_id || projects[0]?.id;
    if (!targetProjectId) {
      alert('يرجى إنشاء مشروع أولاً لإسناد المهمة إليه.');
      return;
    }

    // 1. Create a real task in the target project
    const newTask: Task = {
      id: createId(),
      project_id: targetProjectId,
      title: actionItem.title,
      description: 'مهمة مستخلصة تلقائياً من جلسة المراجعة الدورية والتدقيق التحليلي',
      status: 'todo',
      priority: actionItem.priority || 'medium',
      due_date: toLocalDateKey(),
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
  };

  const handleVoiceAiCommit = async (data: {
    pillarId: string;
    goalId?: string;
    projectTitle: string;
    projectDescription?: string;
    tasks: Array<{
      title: string;
      description?: string;
      priority: 'high' | 'medium' | 'low';
      energyLevel?: 'high' | 'medium' | 'low';
      estimatedHours?: number;
    }>;
  }): Promise<void> => {
    const today = toLocalDateKey();
    const newProjectId = createId();

    // Target goal under chosen pillar
    let targetGoalId = data.goalId;
    let updatedGoals = [...goals];
    if (!targetGoalId) {
      const existingGoal = goals.find((g) => g.pillar_id === data.pillarId);
      if (existingGoal) {
        targetGoalId = existingGoal.id;
      } else {
        const newGoal: ValueGoal = {
          id: createId(),
          pillar_id: data.pillarId,
          title: `هدف: ${data.projectTitle}`,
          description: 'هدف قيمة استراتيجي مستخلص ومولد آلياً بالذكاء الاصطناعي',
          status: 'in_progress',
          progress: 0,
          target_date: null,
          created_at: today,
        };
        updatedGoals.push(newGoal);
        targetGoalId = newGoal.id;
      }
    }

    const newProject: Project = {
      id: newProjectId,
      goal_id: targetGoalId,
      title: data.projectTitle,
      description: data.projectDescription || '',
      status: 'in_progress',
      progress: 0,
      start_date: today,
      due_date: today,
      created_at: today,
    };

    const newTasks: Task[] = data.tasks.map((t, idx) => ({
      id: createId(),
      project_id: newProjectId,
      title: t.title,
      description: t.description || '',
      status: 'todo',
      priority: t.priority,
      due_date: today,
      estimated_hours: t.estimatedHours || 1,
      energy_level: t.energyLevel || 'medium',
      completed_at: null,
      created_at: today,
    }));

    const updatedProjects = [...projects, newProject];
    const updatedTasks = [...tasks, ...newTasks];

    const nextSnapshot: AppDataSnapshot = {
      schemaVersion: 4,
      pillars, visions, goals: updatedGoals, projects: updatedProjects, tasks: updatedTasks,
      reviews, inboxItems, habits, vaults, focusSessions, timeBlocks, customFieldDefinitions,
      worshipDefinitions, worshipLogs, progressionPaths, quranKhatmas, quranHifzTrackers, sleepSchedules,
    };
    if (!repositoryRef.current) throw new Error('المستودع غير جاهز للحفظ.');
    await queueSnapshotSave(repositoryRef.current, nextSnapshot);

    applyStateUpdate(pillars, visions, updatedGoals, updatedProjects, updatedTasks);

    // Drill down to show the created project & tasks immediately
    setSelectedPillarId(data.pillarId);
    setSelectedGoalId(targetGoalId);
    setSelectedProjectId(newProjectId);
    setCurrentTab('hierarchy');

    setToasts((prev) => [
      ...prev,
      {
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'تم تفكيك وإضافة المشروع بالذكاء الاصطناعي!',
        description: `تم إدراج المشروع "${data.projectTitle}" مع ${newTasks.length} مهام تنفيذية.`,
      },
    ]);
  };

  const handleBatchAddTasks = (newTasksData: Partial<Task>[]) => {
    const today = toLocalDateKey();
    const created: Task[] = newTasksData.filter((task) => {
      const projectId = task.project_id || selectedProjectId;
      return Boolean(projectId && projects.some((project) => project.id === projectId));
    }).map((t) => ({
      id: createId(),
      project_id: t.project_id || selectedProjectId || '',
      title: t.title || 'مهمة جديدة',
      description: t.description || '',
      status: t.status || 'todo',
      priority: t.priority || 'medium',
      due_date: t.due_date || today,
      estimated_hours: t.estimated_hours || 1,
      energy_level: t.energy_level || 'medium',
      completed_at: null,
      created_at: today,
    }));
    const updatedTasks = [...tasks, ...created];
    applyStateUpdate(pillars, visions, goals, projects, updatedTasks);
    setToasts((prev) => [
      ...prev,
      {
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'تم التفكيك الذكي بنجاح',
        description: `تمت إضافة ${created.length} مهام تنفيذية إلى المشروع!`,
      },
    ]);
  };

  const handleStartPillarReview = (pillarId: string) => {
    setDefaultReviewFrequency('weekly');
    setDefaultReviewPillarId(pillarId);
    setEditingReview(null);
    setIsReviewModalOpen(true);
  };

  // --- GTD INBOX HANDLERS ---
  const handleAddInboxItem = (data: Partial<InboxItem>) => {
    const newItem: InboxItem = {
      id: createId(),
      title: data.title || '',
      content: data.content || '',
      source_type: data.source_type || 'idea',
      url: data.url,
      status: 'inbox',
      created_at: new Date().toISOString(),
    };
    const updated = [newItem, ...inboxItems];
    setInboxItems(updated);
  };

  const handleDeleteInboxItem = (id: string) => {
    const updated = inboxItems.filter(i => i.id !== id);
    setInboxItems(updated);
  };

  const handleConvertInboxToTask = (item: InboxItem, targetProjectId: string) => {
    const newTask: Task = {
      id: createId(),
      project_id: targetProjectId,
      title: item.title,
      description: item.content || (item.url ? `الرابط المرجعي: ${item.url}` : ''),
      status: 'todo',
      priority: 'medium',
      due_date: toLocalDateKey(),
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
  };

  const handleConvertInboxToVault = (item: InboxItem, targetPillarId: string) => {
    const newVault: VaultItem = {
      id: createId(),
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

    const updatedInbox = inboxItems.map(i => 
      i.id === item.id 
        ? { ...i, status: 'processed' as const, converted_to: 'vault' as const, converted_entity_id: newVault.id }
        : i
    );
    setInboxItems(updatedInbox);
  };

  const handleConvertInboxToHabit = (item: InboxItem, targetPillarId: string) => {
    const newHabit: Habit = {
      id: createId(),
      title: item.title,
      description: item.content || '',
      pillar_id: targetPillarId,
      frequency: 'daily',
      target_days_per_week: 7,
      completed_dates: [],
      current_streak: 0,
      longest_streak: 0,
      is_active: true,
      time_of_day: 'morning',
      created_at: new Date().toISOString(),
    };

    const updatedHabits = [newHabit, ...habits];
    setHabits(updatedHabits);

    const updatedInbox = inboxItems.map(i => 
      i.id === item.id 
        ? { ...i, status: 'processed' as const, converted_to: 'habit' as const, converted_entity_id: newHabit.id }
        : i
    );
    setInboxItems(updatedInbox);
  };

  // --- HABITS HANDLERS ---
  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const alreadyDone = h.completed_dates.includes(dateStr);
      const newDates = alreadyDone
        ? h.completed_dates.filter(d => d !== dateStr)
        : [...h.completed_dates, dateStr];

      const streak = calculateHabitStreak(h, newDates);

      return {
        ...h,
        completed_dates: newDates,
        current_streak: streak.current,
        longest_streak: streak.longest,
      };
    });

    setHabits(updated);
  };

  const handleSaveHabit = (data: Partial<Habit>) => {
    let updated: Habit[];
    if (data.id) {
      updated = habits.map(h => h.id === data.id ? { ...h, ...data } as Habit : h);
    } else {
      const newHabit: Habit = {
        id: createId(),
        title: data.title || '',
        description: data.description || '',
        pillar_id: data.pillar_id || pillars[0]?.id || '',
        frequency: data.frequency || 'daily',
        target_days_per_week: data.target_days_per_week || 7,
        completed_dates: [],
        current_streak: 0,
        longest_streak: 0,
        is_active: true,
        time_of_day: data.time_of_day || 'morning',
        created_at: new Date().toISOString(),
      };
      updated = [newHabit, ...habits];
    }
    setHabits(updated);
  };

  const handleDeleteHabit = (habitId: string) => {
    const updated = habits.filter(h => h.id !== habitId);
    setHabits(updated);
  };

  // --- VAULTS HANDLERS ---
  const handleSaveVaultItem = (data: Partial<VaultItem>) => {
    let updated: VaultItem[];
    if (data.id) {
      updated = vaults.map(v => v.id === data.id ? { ...v, ...data } as VaultItem : v);
    } else {
      const newItem: VaultItem = {
        id: createId(),
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
  };

  const handleDeleteVaultItem = (vaultId: string) => {
    const updated = vaults.filter(v => v.id !== vaultId);
    setVaults(updated);
  };

  const handleSetupIbadat = (categories: WorshipDefinition['category'][]) => {
    const now = new Date().toISOString();
    const pillar: Pillar = {
      id: createId(), title: 'العلاقة مع الله', description: 'ركيزة للعبادات والأوراد والنمو الروحي.',
      pillar_group: 'Spirituality', purpose: 'تقوية العلاقة مع الله بعبادة متدرجة وثابتة.',
      priority: pillars.length + 1, show_on_home: true, status: 'active', progress: 0, created_at: now,
    };
    const templates: Array<Pick<WorshipDefinition, 'category' | 'title' | 'tracking_type' | 'frequency' | 'time_of_day' | 'target_count' | 'target_pages'>> = [
      ...(['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'] as const).map((title, index) => ({ category: 'salah' as const, title, tracking_type: 'multi_option' as const, frequency: 'daily' as const, time_of_day: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'][index] as WorshipDefinition['time_of_day'] })),
      { category: 'adhkar', title: 'أذكار الصباح', tracking_type: 'checkbox', frequency: 'daily', time_of_day: 'morning' },
      { category: 'adhkar', title: 'أذكار المساء', tracking_type: 'checkbox', frequency: 'daily', time_of_day: 'evening' },
      { category: 'quran_wird', title: 'ورد القرآن', tracking_type: 'pages', frequency: 'daily', target_pages: 1 },
      { category: 'qiyam', title: 'قيام الليل', tracking_type: 'multi_option', frequency: 'daily', time_of_day: 'night' },
      { category: 'fasting', title: 'صيام التطوع', tracking_type: 'multi_option', frequency: 'custom' },
      { category: 'sadaqah', title: 'الصدقة', tracking_type: 'amount', frequency: 'daily' },
      { category: 'custom_dua', title: 'ورد مخصص', tracking_type: 'checkbox', frequency: 'daily' },
      { category: 'quran_hifz', title: 'حفظ القرآن ومراجعته', tracking_type: 'pages', frequency: 'daily', target_pages: 1 },
    ];
    const definitions = templates.filter((template) => categories.includes(template.category)).map((template, sort_order) => ({
      id: createId(), pillar_id: pillar.id, is_active: true, sort_order, created_at: now, ...template,
    } as WorshipDefinition));
    const qiyam = definitions.find((definition) => definition.category === 'qiyam');
    const quran = definitions.find((definition) => definition.category === 'quran_wird');
    const hifz = definitions.find((definition) => definition.category === 'quran_hifz');
    setPillars((previous) => [...previous, pillar]);
    setWorshipDefinitions(definitions);
    if (qiyam) setProgressionPaths([{ id: createId(), worship_id: qiyam.id, title: 'مسار قيام الليل', stages: [{ index: 0, title: 'البداية', description: 'ركعتان بعد العشاء', target_value: 2, days_required: 7 }, { index: 1, title: 'التثبيت', description: 'أربع ركعات بعد العشاء', target_value: 4, days_required: 10 }, { index: 2, title: 'الثلث الأخير', description: 'أربع إلى ثمان ركعات قبل الفجر', target_value: 4, days_required: 14 }], current_stage_index: 0, stage_start_date: toLocalDateKey(), consecutive_days: 0, auto_promote: false, created_at: now }]);
    if (qiyam) setSleepSchedules([{ id: createId(), pillar_id: pillar.id, ultimate_bedtime: '21:30', ultimate_waketime: '04:00', current_bedtime: '23:00', current_waketime: '05:30', adjustment_minutes: 15, adjustment_frequency_days: 7, is_active: true, created_at: now }]);
    if (quran) setQuranKhatmas([{ id: createId(), worship_id: quran.id, khatma_number: 1, start_date: toLocalDateKey(), current_page: 1, current_juz: 1, daily_target_pages: quran.target_pages || 1, is_completed: false, created_at: now }]);
    if (hifz) setQuranHifzTrackers([{ id: createId(), worship_id: hifz.id, pillar_id: pillar.id, surahs: [], total_memorized_pages: 0, daily_review_pages: 1, created_at: now }]);
    setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم تفعيل منظومة العبادات', description: 'أُنشئت ركيزة «العلاقة مع الله» وربطت بالعبادات المختارة.' }]);
  };

  const handleSaveWorshipLog = (log: WorshipLog) => {
    setWorshipLogs((previous) => [log, ...previous.filter((item) => item.id !== log.id)]);
  };

  const handleSuggestWorshipBlocks = () => {
    const pillarId = worshipDefinitions[0]?.pillar_id;
    if (!pillarId) return;
    const date = toLocalDateKey();
    const proposed: TimeBlock[] = [
      { id: createId(), date, start_time: '05:30', end_time: '05:45', title: 'أذكار الصباح', pillar_id: pillarId, category: 'worship', is_completed: false, created_at: new Date().toISOString() },
      { id: createId(), date, start_time: '21:30', end_time: '21:45', title: 'ورد القرآن', pillar_id: pillarId, category: 'worship', is_completed: false, created_at: new Date().toISOString() },
    ];
    const overlaps = proposed.some((candidate) => timeBlocks.some((block) => block.date === date && block.start_time < candidate.end_time && candidate.start_time < block.end_time));
    if (overlaps || !confirm('سيُضاف ورد القرآن وأذكار الصباح إلى جدول اليوم. يمكنك تعديلهما لاحقًا.')) {
      if (overlaps) setToasts((previous) => [...previous, { id: createId(), type: 'warning', title: 'تعارض في الجدول', description: 'لم نضف الكتل المقترحة لأن وقتًا موجودًا يتداخل معها.' }]);
      return;
    }
    setTimeBlocks((previous) => [...proposed, ...previous]);
    setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'أُضيفت كتل عبادة مقترحة', description: 'يمكنك تعديلها من حجب الوقت.' }]);
  };

  const handleApproveProgression = (pathId: string) => {
    setProgressionPaths((previous) => previous.map((path) => {
      if (path.id !== pathId || path.current_stage_index >= path.stages.length - 1) return path;
      return { ...path, current_stage_index: path.current_stage_index + 1, consecutive_days: 0, stage_start_date: toLocalDateKey(), last_promotion_date: toLocalDateKey(), updated_at: new Date().toISOString() };
    }));
    setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم اعتماد المرحلة التالية', description: 'يمكنك دائمًا متابعة التدرج بالوتيرة المناسبة لك.' }]);
  };

  const handleUpdateKhatma = (id: string, currentPage: number) => {
    setQuranKhatmas((previous) => previous.map((khatma) => khatma.id === id ? { ...khatma, current_page: currentPage, current_juz: Math.min(30, Math.ceil(currentPage / 20)), is_completed: currentPage >= 604, end_date: currentPage >= 604 ? toLocalDateKey() : null, updated_at: new Date().toISOString() } : khatma));
  };

  const handleUpdateSleep = (id: string, changes: Partial<SleepSchedule>) => {
    setSleepSchedules((previous) => previous.map((schedule) => schedule.id === id ? { ...schedule, ...changes, updated_at: new Date().toISOString() } : schedule));
  };

  const handleUpdateHifz = (id: string, pages: number) => {
    setQuranHifzTrackers((previous) => previous.map((tracker) => tracker.id === id ? { ...tracker, total_memorized_pages: Math.max(0, pages), updated_at: new Date().toISOString() } : tracker));
  };

  const handleEnableWorshipNotifications = async () => {
    try {
      await subscribeToPush();
      setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم تفعيل التذكيرات', description: 'ستصل تنبيهات الصلاة والمهام وفق إعدادات حسابك؛ لا يُرسل تنبيه للشروق.' }]);
    } catch (error) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر تفعيل التذكيرات', description: error instanceof Error ? error.message : 'حاول مرة أخرى.' }]);
    }
  };

  const handleCreateProjectDraft = (item: InboxItem, goalId: string) => {
    setEditingProject(null);
    setNewProjectDefaults({
      title: item.title,
      description: item.content,
      goal_id: goalId,
      status: 'in_progress',
      start_date: toLocalDateKey(),
      due_date: null,
    });
    setIsProjectModalOpen(true);
  };

  const handleResetData = async () => {
    if (confirm('هل تريد حذف بيانات هذا الحساب فقط؟ لا يمكن التراجع عن ذلك.')) {
      await repositoryRef.current?.clear();
      const cleared = emptySnapshot();
      applySnapshot(cleared);
      lastSavedSnapshotRef.current = cleared;
      setSelectedPillarId(null);
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
      setCurrentTab('hierarchy');
    }
  };

  const handleExportData = () => createSnapshotBackup({
    schemaVersion: 4, pillars, visions, goals, projects, tasks, reviews,
    inboxItems, habits, vaults, focusSessions, timeBlocks, customFieldDefinitions,
    worshipDefinitions, worshipLogs, progressionPaths, quranKhatmas, quranHifzTrackers, sleepSchedules,
  });

  const handleImportData = async (file: File) => {
    try {
      const parsed = normalizeSnapshot(JSON.parse(await file.text()));
      const imported = remapSnapshotIds(parsed);
      if (!repositoryRef.current) throw new Error('المستودع غير جاهز للحفظ.');
      await queueSnapshotSave(repositoryRef.current, imported);
      applySnapshot(imported);
      setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم استيراد النسخة الاحتياطية', description: 'أُضيفت البيانات بمعرفات جديدة دون دمج تلقائي.' }]);
    } catch (error) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر استيراد النسخة', description: error instanceof Error ? error.message : 'ملف JSON غير صالح.' }]);
    }
  };

  if (authStatus === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] dark:bg-slate-950" dir="rtl">جاري التحقق من الجلسة...</div>;
  }

  if (!currentUser || authStatus === 'signedOut') {
    return (
      <div className="h-full w-full min-h-screen bg-[#f8f7f4] dark:bg-slate-950 text-[#1a2420] dark:text-slate-100 flex items-center justify-center p-4 selection:bg-[#174235] selection:text-white" dir="rtl">
        <AuthModal
          isOpen={true}
          canDismiss={false}
          onClose={() => {}}
          onAuthSuccess={handleAuthSuccess}
          currentUser={null}
        />
        <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      </div>
    );
  }

  if (!dataReady) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] dark:bg-slate-950" dir="rtl">جاري تحميل بياناتك...</div>;
  }

  return (
    <div className="h-full w-full overflow-hidden bg-[#f8f7f4] dark:bg-slate-950 text-[#1a2420] dark:text-slate-100 flex font-sans antialiased selection:bg-[#174235] selection:text-white" dir="rtl">
      
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
          timeBlocks: timeBlocks.filter(b => b.date === toLocalDateKey()).length,
          ibadat: worshipDefinitions.filter((item) => item.is_active).length,
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenVoiceAi={handleOpenVoiceAi}
        isDark={isDark}
        onToggleDark={handleToggleDark}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        
        {/* Top App Header matching the clean header of screenshot 2 */}
        <header className="bg-white dark:bg-slate-900 border-b border-[#e8e5de] dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
            
            {/* Left section: mobile hamburger & breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 text-[#65736b] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-100 rounded-xl hover:bg-[#f2efe8] dark:hover:bg-slate-800 cursor-pointer shrink-0"
                title="القائمة الجانبية"
              >
                <Menu className="w-5 h-5" />
              </button>

              {currentTab === 'hierarchy' ? (
                <div className="overflow-x-auto py-0.5 max-w-full no-scrollbar">
                  <Breadcrumbs items={breadcrumbItems} onNavigate={handleBreadcrumbClick} />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#6e7b74] dark:text-slate-400 truncate">
                  <span className="font-normal text-[#85928a] dark:text-slate-400 shrink-0">دَوّنـلي</span>
                  <span className="text-[#c2bcaf] dark:text-slate-600 shrink-0">/</span>
                  <span className="font-semibold text-[#1a2420] dark:text-slate-200 truncate">
                    {currentTab === 'inbox' && 'صندوق الوارد'}
                    {currentTab === 'focus' && 'جلسات التركيز'}
                    {currentTab === 'timeblocking' && 'حجب الوقت اليومي'}
                    {currentTab === 'habits' && 'متتبع العادات'}
                    {currentTab === 'vaults' && 'خزائن المعرفة'}
                    {currentTab === 'pillars' && 'الركائز الأساسية'}
                    {currentTab === 'visions' && 'الرؤى المستقبلية'}
                    {currentTab === 'goals' && 'أهداف القيمة'}
                    {currentTab === 'projects' && 'المشروعات التنفيذية'}
                    {currentTab === 'tasks' && 'المهام اليومية'}
                    {currentTab === 'reviews' && 'المراجعات الدورية'}
                    {currentTab === 'ibadat' && 'العبادات والأوراد'}
                  </span>
                </div>
              )}
            </div>

            {/* Right section: Quick Add button and utility actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* VOICE & AI ACTION BUTTON: Amber gradient with microphone and Gemini AI */}
              <button
                onClick={handleOpenVoiceAi}
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer group"
                title="تحدث بصوتك والتحليل والتفكيك الذكي بالذكاء الاصطناعي"
              >
                <Mic className="w-4 h-4 animate-pulse text-amber-100" />
                <Sparkles className="w-3.5 h-3.5 text-amber-200 hidden sm:inline" />
                <span className="whitespace-nowrap hidden sm:inline">تحدث بصوتك</span>
              </button>

              {!currentUser.isGuest && (
                <button
                  onClick={handleConfigureAiKey}
                  aria-label="إعداد مفتاح Gemini المحفوظ للحساب"
                  className="p-2 rounded-xl text-[#55615a] dark:text-slate-300 hover:bg-[#f2efe8] dark:hover:bg-slate-800 border border-[#e8e5de] dark:border-slate-700"
                  title="إعداد مفتاح Gemini المحفوظ للحساب"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}
              {!currentUser.isGuest && hasStoredGeminiCredential() && (
                <button
                  onClick={handleDeleteAiKey}
                  aria-label="حذف مفتاح Gemini من الحساب"
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900"
                  title="حذف مفتاح Gemini"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <InstallAppButton />

              {/* PRIMARY ACTION BUTTON: Deep Forest Green matching Dawenli */}
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                title="إضافة سريعة موحدة (مهمة، مشروع، هدف، رؤية، ركيزة)"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap hidden sm:inline">إضافة سريعة</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={handleToggleDark}
                className="p-2 rounded-xl text-[#55615a] dark:text-slate-300 hover:bg-[#f2efe8] dark:hover:bg-slate-800 border border-[#e8e5de] dark:border-slate-700 transition-colors cursor-pointer"
                title={isDark ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الليلي'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* User Profile / Auth Button */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#e8e5de] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#f2efe8] dark:hover:bg-slate-800 text-[#35403a] dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                title="حساب المستخدم وإعدادات السحابة"
              >
                <div className="w-6 h-6 rounded-full bg-[#174235] text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser?.isGuest ? '؟' : (currentUser?.email?.[0]?.toUpperCase() || 'م')}
                </div>
                <span className="hidden md:inline max-w-[110px] truncate text-[11px]">
                  {currentUser?.isGuest ? 'ضيف المنظومة' : (currentUser?.email?.split('@')[0] || 'حسابي')}
                </span>
              </button>

            </div>

          </div>
        </header>

        {/* Main Body View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
          <React.Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">جاري تحميل القسم...</div>}>
          <div className="max-w-7xl mx-auto w-full space-y-6">
            
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
                      setNewTaskDueDate(null);
                      setIsTaskModalOpen(true);
                    }}
                    onEditTask={(task) => {
                      setNewTaskDueDate(null);
                      setEditingTask(task);
                      setIsTaskModalOpen(true);
                    }}
                    onDeleteTask={handleDeleteTask}
                    onEditProject={(proj) => {
                      setNewProjectDefaults(null);
                      setEditingProject(proj);
                      setIsProjectModalOpen(true);
                    }}
                    onBatchAddTasks={handleBatchAddTasks}
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
                      setNewProjectDefaults(null);
                      setIsProjectModalOpen(true);
                    }}
                    onEditProject={(proj) => {
                      setNewProjectDefaults(null);
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
                    valueGoals={goals.filter((g) => g.vision_id === currentVision.id)}
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
                    onStartFocus={handleStartFocus}
                    onCompleteTask={handleToggleTaskStatus}
                    onOpenTimeBlocking={() => setCurrentTab('timeblocking')}
                    onSelectProject={handleJumpToProject}
                    onAdhanNotify={handleAdhanNotify}
                    worshipDefinitions={worshipDefinitions}
                    worshipLogs={worshipLogs}
                    onOpenIbadat={() => setCurrentTab('ibadat')}
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
                  setNewProjectDefaults(null);
                  setIsProjectModalOpen(true);
                }}
                onEditProject={(proj) => {
                  setNewProjectDefaults(null);
                  setEditingProject(proj);
                  setIsProjectModalOpen(true);
                }}
                onDeleteProject={handleDeleteProject}
                onUpdateStatus={handleUpdateProjectStatus}
                onUpdateCustomFields={handleUpdateProjectCustomFields}
                customFields={customFieldDefinitions.filter((field) => field.entityType === 'project')}
                onCustomFieldsChange={(fields) => setCustomFieldDefinitions((current) => [...current.filter((field) => field.entityType !== 'project'), ...fields])}
              />
            )}

            {/* TAB 6: TASKS TAB */}
            {currentTab === 'tasks' && (
              <TasksTabView
                tasks={tasks}
                projects={projects}
                onToggleStatus={handleToggleTaskStatus}
                onUpdateStatus={handleUpdateTaskStatus}
                onUpdateCustomFields={handleUpdateTaskCustomFields}
                onNewTask={(defaultDate) => {
                  setEditingTask(null);
                  setNewTaskDueDate(defaultDate || null);
                  setIsTaskModalOpen(true);
                }}
                onEditTask={(task) => {
                  setNewTaskDueDate(null);
                  setEditingTask(task);
                  setIsTaskModalOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                onSelectProject={(pId) => handleJumpToProject(pId, projects.find(p => p.id === pId)?.goal_id || '')}
                onStartFocus={handleStartFocus}
                customFields={customFieldDefinitions.filter((field) => field.entityType === 'task')}
                onCustomFieldsChange={(fields) => setCustomFieldDefinitions((current) => [...current.filter((field) => field.entityType !== 'task'), ...fields])}
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
                  setDefaultReviewPillarId(null);
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
                onCreateProjectDraft={handleCreateProjectDraft}
                onConvertToVault={handleConvertInboxToVault}
                onConvertToHabit={handleConvertInboxToHabit}
                onOpenVoiceAi={handleOpenVoiceAi}
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

            {currentTab === 'ibadat' && (
              <IbadatDashboard
                pillars={pillars}
                definitions={worshipDefinitions}
                logs={worshipLogs}
                onSetup={handleSetupIbadat}
                onSaveLog={handleSaveWorshipLog}
                onOpenTimeBlocking={() => setCurrentTab('timeblocking')}
                onSuggestTimeBlocks={handleSuggestWorshipBlocks}
                progressionPaths={progressionPaths}
                onApproveProgression={handleApproveProgression}
                khatmas={quranKhatmas}
                onUpdateKhatma={handleUpdateKhatma}
                sleepSchedules={sleepSchedules}
                onUpdateSleep={handleUpdateSleep}
                onEnableNotifications={() => void handleEnableWorshipNotifications()}
                hifzTrackers={quranHifzTrackers}
                onUpdateHifz={handleUpdateHifz}
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
                goals={goals}
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
                goals={goals}
                pillars={pillars}
                timeBlocks={timeBlocks}
                onSaveTimeBlock={handleSaveTimeBlock}
                onSaveTimeBlocks={handleSaveTimeBlocks}
                onDeleteTimeBlock={handleDeleteTimeBlock}
                onToggleTimeBlockStatus={handleToggleTimeBlockStatus}
                onStartFocusOnTask={handleStartFocus}
              />
            )}

          </div>
          </React.Suspense>
        </main>
      </div>

      {/* 3. MODALS */}
      <React.Suspense fallback={null}>

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
        defaultFocusPillarId={defaultReviewPillarId}
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
        onOpenVoiceAi={handleOpenVoiceAi}
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
          setNewProjectDefaults(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
        defaultProject={newProjectDefaults}
        goalTitle={currentGoal?.title}
        goals={goals}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setNewTaskDueDate(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        projectTitle={currentProject?.title}
        projects={projects}
        defaultDueDate={newTaskDueDate}
      />

      {/* Voice & Gemini AI Intelligent Capture & Decomposition Modal */}
      <VoiceAiCaptureModal
        isOpen={isVoiceAiModalOpen}
        onClose={() => setIsVoiceAiModalOpen(false)}
        pillars={pillars}
        projects={projects}
        goals={goals}
        onCommitHierarchy={handleVoiceAiCommit}
        onCommitSingleTask={handleSaveTask}
      />
      </React.Suspense>

      {/* Real-time Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* User Authentication & Supabase Cloud Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
        onExportData={handleExportData}
        onImportData={(file: File) => { void handleImportData(file); }}
      />

    </div>
  );
};
