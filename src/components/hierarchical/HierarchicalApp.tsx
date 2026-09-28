import React, { lazy, useState, useEffect } from 'react';
import { DailyOverview } from './DailyOverview';
import { changeWorshipSettings, configuredProgression, targetStreak } from '../../utils/ibadat';
import { 
  Pillar, 
  Vision,
  ValueGoal, 
  Project, 
  Task, 
  BreadcrumbItem,
  SystemReview,
  ReviewFrequency,
  InboxItem,
  Habit,
  VaultItem,
  FocusSessionRecord,
  TimeBlock,
  CustomFieldDefinition,
  WorshipDefinition,
  WorshipLog,
  ProgressionPath,
  QuranKhatma,
  QuranHifzTracker,
  SleepSchedule,
  JournalEntry,
  CalendarEvent
} from '../../types/hierarchical';
import { recalculateAllHierarchicalProgress } from '../../utils/hierarchicalStore';

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
const TasksTabView = lazy(() => import('../../features/tasks/components/TasksTabView').then((module) => ({ default: module.TasksTabView })));
const ReviewsTabView = lazy(() => import('./ReviewsTabView').then((module) => ({ default: module.ReviewsTabView })));
const ReviewModal = lazy(() => import('./ReviewModal').then((module) => ({ default: module.ReviewModal })));
const InboxTabView = lazy(() => import('../../features/inbox/components/InboxTabView').then((module) => ({ default: module.InboxTabView })));
const HabitsTabView = lazy(() => import('../../features/habits/components/HabitsTabView').then((module) => ({ default: module.HabitsTabView })));
const VaultsTabView = lazy(() => import('../../features/vaults/components/VaultsTabView').then((module) => ({ default: module.VaultsTabView })));
const FocusSessionView = lazy(() => import('./FocusSessionView').then((module) => ({ default: module.FocusSessionView })));
const TimeBlockingView = lazy(() => import('./TimeBlockingView').then((module) => ({ default: module.TimeBlockingView })));
const IbadatDashboard = lazy(() => import('../../features/ibadat/components/IbadatDashboard').then((module) => ({ default: module.IbadatDashboard })));
const JournalTabView = lazy(() => import('../../features/journals/components/JournalTabView').then((module) => ({ default: module.JournalTabView })));
const CalendarTabView = lazy(() => import('../../features/calendar/components/CalendarTabView').then((module) => ({ default: module.CalendarTabView })));
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
import { setTaskStatus, toggleTaskStatus, upsertTask } from '../../features/tasks/utils/taskActions';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useAppStore } from '../../app/store/appStore';
import { useTaskStore } from '../../features/tasks/store/taskStore';
import { useHabitStore } from '../../features/habits/store/habitStore';
import { useDashboardNavigation } from '../../features/dashboard/hooks/useDashboardNavigation';
import { useInboxStore } from '../../features/inbox/store/inboxStore';
import { useVaultStore } from '../../features/vaults/store/vaultStore';
import { useIbadatStore } from '../../features/ibadat/store/ibadatStore';
import { useAppDataPersistence, emptyAppSnapshot } from '../../app/store/useAppDataPersistence';
import { createSnapshotBackup, normalizeSnapshot } from '../../data/repository';
import { remapSnapshotIds } from '../../data/legacyMigration';
import { createId } from '../../utils/id';
import { toLocalDateKey } from '../../utils/date';
import { calculateHabitStreak } from '../../utils/habitStreak';
import type { PushNotificationPreferences } from '../../utils/pushNotifications';
import { useAI } from '../../features/ai/hooks/useAI';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';
import { useReviews } from '../../features/reviews/hooks/useReviews';
import { useHierarchyCrud } from '../../features/dashboard/hooks/useHierarchyCrud';
import { useJournalStore } from '../../features/journals/store/journalStore';
import { useCalendarStore } from '../../features/calendar/store/calendarStore';
import { applyAiCommandActions, buildAiCommandContext } from '../../features/ai/commands/executor';
import type { AiCommandAction } from '../../features/ai/commands/schema';
import { supabase } from '../../shared/services/supabaseClient';

export const HierarchicalApp: React.FC = () => {
  const { status: authStatus, user: currentUser, adoptUser, signOut: authSignOut } = useAuth();
  const { configured: aiConfigured, refreshCredential, saveCredential, deleteCredential } = useAI();
  const { subscribe: subscribeNotifications } = useNotifications();
  const appStore = useAppStore();
  const { tasks, setTasks } = useTaskStore();
  const { habits, setHabits } = useHabitStore();
  const { inboxItems, setInboxItems } = useInboxStore();
  const { vaults, setVaults } = useVaultStore();
  const { worshipDefinitions, worshipLogs, setWorshipDefinitions, setWorshipLogs } = useIbadatStore();
  const { journals, setJournals } = useJournalStore();
  const { calendarEvents, setCalendarEvents } = useCalendarStore();
  // Remaining cross-feature collections stay in appStore during the incremental migration.
  const { pillars, visions, goals, projects, reviews, focusSessions, timeBlocks,
    customFieldDefinitions, progressionPaths, quranKhatmas, quranHifzTrackers,
    sleepSchedules, setPillars, setVisions, setGoals, setProjects, setReviews,
    setFocusSessions, setTimeBlocks, setCustomFieldDefinitions,
    setProgressionPaths, setQuranKhatmas, setQuranHifzTrackers, setSleepSchedules } = appStore;
  const {
    activeFocusTask, setActiveFocusTask, currentTab, setCurrentTab, isMobileSidebarOpen, setIsMobileSidebarOpen,
    selectedPillarId, setSelectedPillarId, selectedVisionId, setSelectedVisionId, selectedGoalId, setSelectedGoalId,
    selectedProjectId, setSelectedProjectId,
  } = useDashboardNavigation();

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isVoiceAiModalOpen, setIsVoiceAiModalOpen] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiKeyDraft, setGeminiKeyDraft] = useState('');
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [syncingGoogleCalendar, setSyncingGoogleCalendar] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const { dataReady, clearData, saveSnapshot, applySnapshot, snapshot } = useAppDataPersistence({
    user: currentUser,
    authStatus,
    onLoadError: (error) => setToasts((previous) => [...previous, {
      id: createId(), type: 'error', title: 'تعذر مزامنة البيانات',
      description: error instanceof Error ? error.message : 'تعذر تحميل أو حفظ البيانات.',
    }]),
  });

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

  useEffect(() => {
    if (authStatus !== 'authenticated' || !supabase) return;
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) return;
      const response = await fetch('/api/integrations/google/status', { headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' } });
      const body = await response.json().catch(() => null) as { data?: { connected?: boolean } } | null;
      if (active) setGoogleCalendarConnected(Boolean(body?.data?.connected));
    })();
    return () => { active = false; };
  }, [authStatus, currentUser?.id]);

  useEffect(() => {
    if (!googleCalendarConnected || !supabase) return;
    const client = supabase;
    let active = true;
    const sync = async () => {
      try {
        const { data } = await client.auth.getSession();
        if (!data.session?.access_token) return;
        setSyncingGoogleCalendar(true);
        const response = await fetch('/api/integrations/google/sync', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' } });
        const body = await response.json().catch(() => null) as { data?: { events?: CalendarEvent[] }; error?: { message?: string } } | null;
        if (active && response.ok && body?.data?.events) setCalendarEvents(body.data.events);
      } finally {
        if (active) setSyncingGoogleCalendar(false);
      }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 5 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [googleCalendarConnected]);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('google');
    if (!result) return;
    const messages: Record<string, { title: string; description: string; type: ToastMessage['type'] }> = {
      connected: { title: 'تم ربط Google Calendar', description: 'يمكنك الآن متابعة إعداد المزامنة من صفحة التقويم.', type: 'success' },
      cancelled: { title: 'تم إلغاء ربط Google Calendar', description: 'لم يتم تغيير أي إعداد.', type: 'info' },
      error: { title: 'تعذر ربط Google Calendar', description: 'تحقق من إعدادات OAuth وحاول مرة أخرى.', type: 'error' },
    };
    const message = messages[result];
    if (message) setToasts((previous) => [...previous, { id: createId(), ...message }]);
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash}`);
  }, []);

  const handleToggleDark = () => {
    setIsDark((prev) => !prev);
  };

  const handleAuthSuccess = (user: { id?: string; email: string; isGuest?: boolean }) => {
    adoptUser(user);
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
    try { await authSignOut(); } catch (e) { console.warn('Supabase sign out error:', e); }
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

  const handleConfigureAiKey = async (): Promise<boolean> => {
    if (currentUser?.isGuest || authStatus !== 'authenticated') {
      alert('ميزات Gemini متاحة للحسابات المسجلة فقط.');
      return false;
    }
    await refreshCredential().catch(() => false);
    setGeminiKeyDraft('');
    setIsGeminiModalOpen(true);
    return false;
  };

  const handleSaveGeminiKey = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = geminiKeyDraft.trim();
    if (value.length < 16) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'مفتاح Gemini غير صالح', description: 'ألصق مفتاح Gemini كاملًا ثم حاول مرة أخرى.' }]);
      return;
    }
    try {
      await saveCredential(value);
      setIsGeminiModalOpen(false);
      setGeminiKeyDraft('');
      setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم حفظ Gemini بأمان', description: 'المفتاح مشفّر ومربوط بحسابك فقط.' }]);
    } catch (error) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر حفظ مفتاح Gemini', description: error instanceof Error ? error.message : 'تحقق من اتصال الحساب ثم حاول مرة أخرى.' }]);
    }
  };

  const handleDeleteAiKey = async () => {
    if (!confirm('حذف مفتاح Gemini من هذا الحساب؟')) return;
    try {
      await deleteCredential();
      setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم حذف مفتاح Gemini', description: 'لن تعمل ميزات الذكاء حتى تضيف مفتاحًا جديدًا.' }]);
    } catch (error) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر حذف مفتاح Gemini', description: error instanceof Error ? error.message : 'حاول مرة أخرى.' }]);
    }
  };

  const handleOpenVoiceAi = async () => {
    const configured = aiConfigured || await refreshCredential().catch(() => false);
    if ((configured || await handleConfigureAiKey()) && authStatus === 'authenticated') {
      setIsVoiceAiModalOpen(true);
    }
  };

  const handleSaveJournal = (input: Partial<JournalEntry>) => {
    const now = new Date().toISOString();
    setJournals((current) => {
      const existing = input.id ? current.find((entry) => entry.id === input.id) : undefined;
      const entry: JournalEntry = { id: input.id || createId(), title: input.title || 'يومياتي', content: input.content || '', entry_date: input.entry_date || toLocalDateKey(), mood: input.mood || null, tags: input.tags || [], pillar_id: input.pillar_id || null, project_id: input.project_id || null, audio_path: input.audio_path ?? existing?.audio_path ?? null, created_at: existing?.created_at || now, updated_at: now };
      return existing ? current.map((item) => item.id === entry.id ? entry : item) : [...current, entry];
    });
  };

  const handleDeleteJournal = (entry: JournalEntry) => {
    if (!confirm(`حذف اليومية «${entry.title}»؟`)) return;
    setJournals((current) => current.filter((item) => item.id !== entry.id));
    if (entry.audio_path && !currentUser?.isGuest && supabase) void supabase.storage.from('journal-audio').remove([entry.audio_path]);
  };

  const handleSaveCalendarEvent = (input: Partial<CalendarEvent>) => {
    const now = new Date().toISOString();
    setCalendarEvents((current) => {
      const existing = input.id ? current.find((event) => event.id === input.id) : undefined;
      const event: CalendarEvent = { id: input.id || createId(), title: input.title || 'موعد جديد', description: input.description || '', start_at: input.start_at || now, end_at: input.end_at || null, all_day: input.all_day || false, timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo', recurrence: input.recurrence || { frequency: 'none', interval: 1 }, reminder_minutes: input.reminder_minutes ?? null, task_id: input.task_id || null, project_id: input.project_id || null, pillar_id: input.pillar_id || null, is_cancelled: input.is_cancelled || false, created_at: existing?.created_at || now, updated_at: now };
      return existing ? current.map((item) => item.id === event.id ? event : item) : [...current, event];
    });
  };

  const handleDeleteCalendarEvent = (event: CalendarEvent) => {
    if (!confirm(`حذف الموعد «${event.title}»؟`)) return;
    setCalendarEvents((current) => current.map((item) => item.id === event.id ? { ...item, is_cancelled: true, updated_at: new Date().toISOString() } : item));
  };

  const handleConnectGoogleCalendar = async () => {
    if (!supabase) { setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر ربط Google Calendar', description: 'خدمة الحساب غير مهيأة.' }]); return; }
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch('/api/integrations/google/start', { headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, Accept: 'application/json' } });
      const raw = await response.text();
      let body: { data?: { authorizationUrl?: string }; error?: { message?: string } } = {};
      try { body = JSON.parse(raw) as typeof body; } catch { throw new Error('خدمة Google Calendar غير متاحة على هذه النسخة من Preview. أعد تحميل الصفحة ثم حاول مرة أخرى.'); }
      if (!response.ok || !body.data?.authorizationUrl) throw new Error(body.error?.message || 'تعذر بدء ربط Google Calendar.');
      window.location.assign(body.data.authorizationUrl);
    } catch (error) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر ربط Google Calendar', description: error instanceof Error ? error.message : 'حاول مرة أخرى.' }]);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    if (!supabase || syncingGoogleCalendar) return;
    setSyncingGoogleCalendar(true);
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch('/api/integrations/google/sync', { method: 'POST', headers: { Authorization: `Bearer ${data.session?.access_token || ''}`, Accept: 'application/json' } });
      const body = await response.json().catch(() => null) as { data?: { events?: CalendarEvent[] }; error?: { message?: string } } | null;
      if (!response.ok || !body?.data?.events) throw new Error(body?.error?.message || 'تعذرت مزامنة Google Calendar.');
      setCalendarEvents(body.data.events);
      setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'اكتملت مزامنة Google Calendar', description: 'تم تحديث المواعيد في الاتجاهين.' }]);
    } catch (error) {
      setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذرت مزامنة Google Calendar', description: error instanceof Error ? error.message : 'حاول مرة أخرى.' }]);
    } finally { setSyncingGoogleCalendar(false); }
  };

  const handleApplyAiActions = async (actions: AiCommandAction[], options: { audioBlob: Blob | null; attachAudioToJournal: boolean }) => {
    const latest = snapshot;
    const result = applyAiCommandActions(latest, actions);
    const recalculated = recalculateAllHierarchicalProgress(result.snapshot.pillars, result.snapshot.visions, result.snapshot.goals, result.snapshot.projects, result.snapshot.tasks);
    result.snapshot.pillars = recalculated.pillars; result.snapshot.visions = recalculated.visions; result.snapshot.goals = recalculated.goals; result.snapshot.projects = recalculated.projects; result.snapshot.tasks = recalculated.tasks;
    let uploadedPath: string | null = null;
    if (options.attachAudioToJournal && options.audioBlob && result.createdJournalIds.length) {
      if (!currentUser || currentUser.isGuest || !supabase) throw new Error('إرفاق الصوت متاح للحسابات المسجلة فقط.');
      const journalId = result.createdJournalIds[0];
      const extension = options.audioBlob.type.includes('mpeg') ? 'mp3' : options.audioBlob.type.includes('mp4') ? 'm4a' : options.audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
      uploadedPath = `${currentUser.id}/${journalId}/${createId()}.${extension}`;
      const { error } = await supabase.storage.from('journal-audio').upload(uploadedPath, options.audioBlob, { contentType: options.audioBlob.type || 'audio/webm', upsert: false });
      if (error) throw new Error('تعذر رفع التسجيل الصوتي.');
      result.snapshot.journals = result.snapshot.journals.map((entry) => entry.id === journalId ? { ...entry, audio_path: uploadedPath } : entry);
    }
    try {
      await saveSnapshot(result.snapshot);
      applySnapshot(result.snapshot);
    } catch (error) {
      if (uploadedPath && supabase) await supabase.storage.from('journal-audio').remove([uploadedPath]);
      throw error;
    }
    if (result.removedAudioPaths.length && supabase) void supabase.storage.from('journal-audio').remove(result.removedAudioPaths);
    setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم تنفيذ الخطة بعد موافقتك', description: `تم تطبيق ${actions.length} تغييرات بأمان.` }]);
  };

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

  const { saveReview, deleteReview, convertActionToTask } = useReviews({
    reviews, setReviews, editingReview, pillars, visions, goals, projects, tasks,
    worshipDefinitions, worshipLogs, applyStateUpdate,
    onCloseEditor: () => { setIsReviewModalOpen(false); setEditingReview(null); },
  });

  // Active Entities for drill-down context
  const currentPillar = pillars.find((p) => p.id === selectedPillarId) || null;
  const currentVision = visions.find((v) => v.id === selectedVisionId) || null;
  const currentGoal = goals.find((g) => g.id === selectedGoalId) || null;
  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;
  const hierarchyCrud = useHierarchyCrud({
    pillars, visions, goals, projects, tasks, habits, vaults, timeBlocks, focusSessions,
    selectedPillarId, selectedVisionId, selectedGoalId, selectedProjectId,
    currentPillar, currentVision, currentGoal, currentProject,
    editingPillar, editingVision, editingGoal, editingProject, editingTask,
    setPillars, setVisions, setGoals, setProjects, setTasks, setHabits, setVaults, setTimeBlocks, setFocusSessions,
    setEditingPillar, setEditingVision, setEditingGoal, setEditingProject, setEditingTask,
    setSelectedPillarId, setSelectedVisionId, setSelectedGoalId, setSelectedProjectId,
    setActiveFocusTask, setCurrentTab, applyStateUpdate,
  });

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
      updated = vaults.map(v => v.id === data.id ? { ...v, ...data, status: data.status || v.status || 'active' } as VaultItem : v);
    } else {
      const newItem: VaultItem = {
        id: createId(),
        title: data.title || '',
        vault_type: data.vault_type || 'notes',
        learning: data.learning,
        pillar_id: data.pillar_id || pillars[0]?.id || '',
        project_id: data.project_id || null,
        author_or_source: data.author_or_source,
        url: data.url,
        summary: data.summary || '',
        content: data.content || '',
        tags: data.tags || [],
        rating: data.rating || 5,
        status: data.status || 'active',
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
    const existingWorshipPillar = pillars.find((p) => p.id === worshipDefinitions[0]?.pillar_id) || pillars.find((p) => p.title === 'العلاقة مع الله');
    const pillar: Pillar = existingWorshipPillar || {
      id: createId(), title: 'العلاقة مع الله', description: 'ركيزة للعبادات والأوراد والنمو الروحي.',
      pillar_group: 'Spirituality', purpose: 'تقوية العلاقة مع الله بعبادة متدرجة وثابتة.',
      priority: pillars.length + 1, show_on_home: true, status: 'active', progress: 0, created_at: now,
    };
    const templates: Array<Pick<WorshipDefinition, 'category' | 'title' | 'tracking_type' | 'frequency' | 'time_of_day' | 'target_count' | 'target_pages' | 'scheduled_days'>> = [
      ...(['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'] as const).map((title, index) => ({ category: 'salah' as const, title, tracking_type: 'multi_option' as const, frequency: 'daily' as const, time_of_day: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'][index] as WorshipDefinition['time_of_day'] })),
      { category: 'adhkar', title: 'أذكار الصباح', tracking_type: 'checkbox', frequency: 'daily', time_of_day: 'morning' },
      { category: 'adhkar', title: 'أذكار المساء', tracking_type: 'checkbox', frequency: 'daily', time_of_day: 'evening' },
      // ربع الجزء ≈ 5 صفحات في مصحف المدينة؛ الزيادة تتم عبر مسار اقتراحي.
      { category: 'quran_wird', title: 'ورد القرآن (ربع يوميًا)', tracking_type: 'pages', frequency: 'daily', target_pages: 5 },
      { category: 'qiyam', title: 'قيام الليل', tracking_type: 'multi_option', frequency: 'daily', time_of_day: 'night' },
      { category: 'fasting', title: 'صيام التطوع (الاثنين والخميس)', tracking_type: 'multi_option', frequency: 'custom', scheduled_days: [1, 4] },
      { category: 'sunnah_rawatib', title: 'سنة الفجر — قبل الصلاة', time_of_day: 'fajr', tracking_type: 'counter', frequency: 'daily', target_count: 2 },
      { category: 'sunnah_rawatib', title: 'سنة الظهر — قبل الصلاة', time_of_day: 'dhuhr', tracking_type: 'counter', frequency: 'daily', target_count: 4 },
      { category: 'sunnah_rawatib', title: 'سنة الظهر — بعد الصلاة', time_of_day: 'dhuhr', tracking_type: 'counter', frequency: 'daily', target_count: 2 },
      { category: 'sunnah_rawatib', title: 'سنة المغرب — بعد الصلاة', time_of_day: 'maghrib', tracking_type: 'counter', frequency: 'daily', target_count: 2 },
      { category: 'sunnah_rawatib', title: 'سنة العشاء — بعد الصلاة', time_of_day: 'isha', tracking_type: 'counter', frequency: 'daily', target_count: 2 },
      { category: 'sadaqah', title: 'الصدقة', tracking_type: 'amount', frequency: 'daily' },
      { category: 'custom_dua', title: 'ورد مخصص', tracking_type: 'checkbox', frequency: 'daily' },
      { category: 'quran_hifz', title: 'حفظ القرآن ومراجعته', tracking_type: 'pages', frequency: 'daily', target_pages: 1 },
    ];
    const additions = templates.filter((template) => categories.includes(template.category) && !worshipDefinitions.some((d) => d.category === template.category)).map((template, sort_order) => ({
      id: createId(), pillar_id: pillar.id, is_active: true, sort_order, created_at: now, ...template,
    } as WorshipDefinition));
    const definitions = [...worshipDefinitions, ...additions].map((definition) => {
      if (!categories.includes(definition.category) || progressionPaths.some((p) => p.worship_id === definition.id)) return definition;
      if (definition.category === 'quran_wird') return { ...definition, target_pages: 5 };
      if (definition.category === 'fasting') return { ...definition, scheduled_days: [1, 4] };
      return definition;
    });
    const qiyam = definitions.find((definition) => definition.category === 'qiyam');
    const quran = definitions.find((definition) => definition.category === 'quran_wird');
    const hifz = definitions.find((definition) => definition.category === 'quran_hifz');
    if (!existingWorshipPillar) setPillars((previous) => [...previous, pillar]);
    setWorshipDefinitions(definitions);
    const progression: ProgressionPath[] = [];
    if (qiyam) progression.push({ id: createId(), worship_id: qiyam.id, title: 'مسار قيام الليل', stages: [{ index: 0, title: 'البداية', description: 'ركعتان بعد العشاء', target_value: 2, days_required: 7 }, { index: 1, title: 'التثبيت', description: 'أربع ركعات بعد العشاء', target_value: 4, days_required: 10 }, { index: 2, title: 'الثلث الأخير', description: 'أربع إلى ثمان ركعات قبل الفجر', target_value: 4, days_required: 14 }], current_stage_index: 0, stage_start_date: toLocalDateKey(), consecutive_days: 0, auto_promote: false, created_at: now });
    if (quran) progression.push({ id: createId(), worship_id: quran.id, title: 'مسار ورد القرآن', stages: [{ index: 0, title: 'ربع يوميًا', description: '5 صفحات يوميًا', target_value: 5, days_required: 7 }, { index: 1, title: 'نصف جزء', description: '10 صفحات يوميًا', target_value: 10, days_required: 14 }, { index: 2, title: 'جزء يوميًا', description: '20 صفحة يوميًا', target_value: 20, days_required: 21 }], current_stage_index: 0, stage_start_date: toLocalDateKey(), consecutive_days: 0, auto_promote: false, created_at: now });
    const fasting = definitions.find((definition) => definition.category === 'fasting');
    if (fasting) progression.push({ id: createId(), worship_id: fasting.id, title: 'مسار صيام التطوع', stages: [{ index: 0, title: 'الاثنين والخميس', description: 'ابدأ بيومي الاثنين والخميس', target_value: 2, days_required: 14 }, { index: 1, title: 'الأيام البيض', description: 'أضف 13 و14 و15 من الشهر الهجري', target_value: 5, days_required: 21 }, { index: 2, title: 'توسع اختياري', description: 'اختر صيامًا إضافيًا يناسبك', target_value: 6, days_required: 30 }], current_stage_index: 0, stage_start_date: toLocalDateKey(), consecutive_days: 0, auto_promote: false, created_at: now });
    setProgressionPaths((previous) => [...previous, ...progression.filter((path) => !previous.some((p) => p.worship_id === path.worship_id))]);
    if (qiyam && !sleepSchedules.length) setSleepSchedules([{ id: createId(), pillar_id: pillar.id, ultimate_bedtime: '21:30', ultimate_waketime: '04:00', current_bedtime: '23:00', current_waketime: '05:30', adjustment_minutes: 15, adjustment_frequency_days: 7, is_active: true, created_at: now }]);
    if (quran && !quranKhatmas.length) setQuranKhatmas([{ id: createId(), worship_id: quran.id, khatma_number: 1, start_date: toLocalDateKey(), current_page: 1, current_juz: 1, daily_target_pages: quran.target_pages || 5, is_completed: false, created_at: now }]);
    if (hifz && !quranHifzTrackers.length) setQuranHifzTrackers([{ id: createId(), worship_id: hifz.id, pillar_id: pillar.id, surahs: [], total_memorized_pages: 0, daily_review_pages: 1, created_at: now }]);
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

  const handleUpdateWorshipDefinition = (id: string, patch: Partial<WorshipDefinition>) => {
    setWorshipDefinitions((previous) => previous.map((definition) => definition.id === id ? changeWorshipSettings(definition, patch) : definition));
    setProgressionPaths((previous) => previous.map((path) => path.worship_id === id ? { ...path, stage_start_date: toLocalDateKey(), consecutive_days: 0 } : path));
    if (patch.target_pages != null) setQuranKhatmas((previous) => previous.map((khatma) => khatma.worship_id === id ? { ...khatma, daily_target_pages: patch.target_pages! } : khatma));
  };

  const handleApproveProgression = (pathId: string) => {
    const storedPath = progressionPaths.find((path) => path.id === pathId);
    const definition = worshipDefinitions.find((d) => d.id === storedPath?.worship_id);
    if (!storedPath || !definition) return;
    const selectedPath = configuredProgression(storedPath, definition);
    const nextStage = selectedPath?.stages[selectedPath.current_stage_index + 1];
    if (!selectedPath || !nextStage) return;
    if (targetStreak(definition, worshipLogs, selectedPath.stage_start_date) < selectedPath.stages[selectedPath.current_stage_index].days_required) return;
    if (definition.category === 'qiyam') handleUpdateWorshipDefinition(definition.id, { target_count: nextStage.target_value });
    if (definition.category === 'quran_wird') handleUpdateWorshipDefinition(definition.id, { target_pages: nextStage.target_value });
    if (definition.category === 'fasting') handleUpdateWorshipDefinition(definition.id, { frequency: 'custom', scheduled_hijri_days: [13, 14, 15] });
    setProgressionPaths((previous) => previous.map((path) => {
      if (path.id !== pathId) return path;
      return { ...selectedPath, current_stage_index: path.current_stage_index + 1, consecutive_days: 0, stage_start_date: toLocalDateKey(), last_promotion_date: toLocalDateKey(), updated_at: new Date().toISOString() };
    }));
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

  const handleEnableWorshipNotifications = async (preferences: PushNotificationPreferences) => {
    try {
      await subscribeNotifications(preferences);
      setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم تفعيل التذكيرات', description: 'ستصل تنبيهات الصلاة والمهام والعبادات الموقّتة وفق إعدادات حسابك؛ لا يُرسل تنبيه للشروق.' }]);
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
      await clearData();
      applySnapshot(emptyAppSnapshot());
      setSelectedPillarId(null);
      setSelectedVisionId(null);
      setSelectedGoalId(null);
      setSelectedProjectId(null);
      setCurrentTab('hierarchy');
    }
  };

  const handleExportData = () => createSnapshotBackup({
    schemaVersion: 5, pillars, visions, goals, projects, tasks, reviews,
    inboxItems, habits, vaults, focusSessions, timeBlocks, customFieldDefinitions,
    worshipDefinitions, worshipLogs, progressionPaths, quranKhatmas, quranHifzTrackers, sleepSchedules, journals, calendarEvents,
  });

  const handleImportData = async (file: File) => {
    try {
      const parsed = normalizeSnapshot(JSON.parse(await file.text()));
      const imported = remapSnapshotIds(parsed);
      await saveSnapshot(imported);
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
          calendar: calendarEvents.filter((event) => !event.is_cancelled).length,
          journals: journals.length,
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
                    {currentTab === 'calendar' && 'التقويم والمواعيد'}
                    {currentTab === 'journals' && 'اليوميات'}
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
              {!currentUser.isGuest && aiConfigured && (
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
                    onToggleTaskStatus={hierarchyCrud.toggleStatus}
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
                    onDeleteTask={hierarchyCrud.deleteTask}
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
                    onDeleteProject={hierarchyCrud.deleteProject}
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
                    onDeleteGoal={hierarchyCrud.deleteGoal}
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
                    onDeleteVision={hierarchyCrud.deleteVision}
                    onEditPillar={(p) => {
                      setEditingPillar(p);
                      setIsPillarModalOpen(true);
                    }}
                    onStartPillarReview={handleStartPillarReview}
                  />
                ) : (
                  /* 5. Level 1: Root Pillars List */
                  <PillarsListView
                    dailyOverview={<DailyOverview tasks={tasks} vaults={vaults} definitions={worshipDefinitions} logs={worshipLogs} onNavigate={(destination) => setCurrentTab(destination)} />}
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
                    onDeletePillar={hierarchyCrud.deletePillar}
                    onStartFocus={hierarchyCrud.startFocus}
                    onCompleteTask={hierarchyCrud.toggleStatus}
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
                onDeletePillar={hierarchyCrud.deletePillar}
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
                onDeleteVision={hierarchyCrud.deleteVision}
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
                onDeleteGoal={hierarchyCrud.deleteGoal}
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
                onDeleteProject={hierarchyCrud.deleteProject}
                onUpdateStatus={hierarchyCrud.updateProjectStatus}
                onUpdateCustomFields={hierarchyCrud.updateProjectCustomFields}
                customFields={customFieldDefinitions.filter((field) => field.entityType === 'project')}
                onCustomFieldsChange={(fields) => setCustomFieldDefinitions((current) => [...current.filter((field) => field.entityType !== 'project'), ...fields])}
              />
            )}

            {/* TAB 6: TASKS TAB */}
            {currentTab === 'tasks' && (
              <TasksTabView
                tasks={tasks}
                projects={projects}
                onToggleStatus={hierarchyCrud.toggleStatus}
                onUpdateStatus={hierarchyCrud.updateStatus}
                onUpdateCustomFields={hierarchyCrud.updateTaskCustomFields}
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
                onDeleteTask={hierarchyCrud.deleteTask}
                onSelectProject={(pId) => handleJumpToProject(pId, projects.find(p => p.id === pId)?.goal_id || '')}
                onStartFocus={hierarchyCrud.startFocus}
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
                onDeleteReview={deleteReview}
                onConvertActionToTask={convertActionToTask}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarTabView
                events={calendarEvents}
                pillars={pillars}
                projects={projects}
                tasks={tasks}
                onSave={handleSaveCalendarEvent}
                onDelete={handleDeleteCalendarEvent}
                onEnableNotifications={() => void subscribeNotifications({ calendarEnabled: true }).then(() => setToasts((previous) => [...previous, { id: createId(), type: 'success', title: 'تم تفعيل تذكيرات التقويم', description: 'ستصلك التذكيرات وفق المواعيد التي تختارها.' }])).catch((error) => setToasts((previous) => [...previous, { id: createId(), type: 'error', title: 'تعذر تفعيل التذكيرات', description: error instanceof Error ? error.message : 'حاول مرة أخرى.' }]))}
                onConnectGoogle={() => void handleConnectGoogleCalendar()}
                onSyncGoogle={() => void handleSyncGoogleCalendar()}
                googleConnected={googleCalendarConnected}
                syncingGoogle={syncingGoogleCalendar}
              />
            )}

            {currentTab === 'journals' && (
              <JournalTabView entries={journals} pillars={pillars} projects={projects} onSave={handleSaveJournal} onDelete={handleDeleteJournal} />
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
                onUpdateDefinition={handleUpdateWorshipDefinition}
                onSaveLog={handleSaveWorshipLog}
                onOpenTimeBlocking={() => setCurrentTab('timeblocking')}
                onSuggestTimeBlocks={handleSuggestWorshipBlocks}
                progressionPaths={progressionPaths}
                onApproveProgression={handleApproveProgression}
                khatmas={quranKhatmas}
                onUpdateKhatma={handleUpdateKhatma}
                sleepSchedules={sleepSchedules}
                onUpdateSleep={handleUpdateSleep}
                onEnableNotifications={(preferences) => void handleEnableWorshipNotifications(preferences)}
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
                onToggleTaskStatus={hierarchyCrud.toggleStatus}
                onSaveSession={hierarchyCrud.saveFocusSession}
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
                onSaveTimeBlock={hierarchyCrud.saveTimeBlock}
                onSaveTimeBlocks={hierarchyCrud.saveTimeBlocks}
                onDeleteTimeBlock={hierarchyCrud.deleteTimeBlock}
                onToggleTimeBlockStatus={hierarchyCrud.toggleTimeBlockStatus}
                onStartFocusOnTask={hierarchyCrud.startFocus}
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
        onSaveReview={saveReview}
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
        onAddTask={hierarchyCrud.saveTask}
        onAddProject={hierarchyCrud.saveProject}
        onAddGoal={hierarchyCrud.saveGoal}
        onAddVision={hierarchyCrud.saveVision}
        onAddPillar={hierarchyCrud.savePillar}
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
        onSave={hierarchyCrud.savePillar}
        initialPillar={editingPillar}
      />

      {/* Vision Modal */}
      <VisionModal
        isOpen={isVisionModalOpen}
        onClose={() => {
          setIsVisionModalOpen(false);
          setEditingVision(null);
        }}
        onSave={hierarchyCrud.saveVision}
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
        onSave={hierarchyCrud.saveGoal}
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
        onSave={hierarchyCrud.saveProject}
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
        onSave={hierarchyCrud.saveTask}
        initialTask={editingTask}
        projectTitle={currentProject?.title}
        projects={projects}
        defaultDueDate={newTaskDueDate}
      />

      {isGeminiModalOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" dir="rtl">
        <form onSubmit={handleSaveGeminiKey} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
          <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900 dark:text-white">إعداد مفتاح Gemini</h2><p className="mt-1 text-xs text-slate-500">المفتاح يُرسل إلى خادم Dawenli ويُحفظ مشفرًا لحسابك فقط.</p></div><button type="button" onClick={() => setIsGeminiModalOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">×</button></div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Gemini API Key<input autoFocus type="password" value={geminiKeyDraft} onChange={(event) => setGeminiKeyDraft(event.target.value)} placeholder="AIza..." className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800" /></label>
          <p className="text-xs text-slate-500">يمكنك إنشاء المفتاح من Google AI Studio. لا تضعه في الكود أو في ملف عام.</p>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsGeminiModalOpen(false)} className="rounded-xl border px-4 py-2 text-sm dark:border-slate-700">إلغاء</button><button type="submit" className="rounded-xl bg-[#174235] px-5 py-2 text-sm font-bold text-white">حفظ المفتاح</button></div>
        </form>
      </div>}

      {/* Voice & Gemini AI Intelligent Capture & Decomposition Modal */}
      <VoiceAiCaptureModal
        isOpen={isVoiceAiModalOpen}
        onClose={() => setIsVoiceAiModalOpen(false)}
        context={buildAiCommandContext(snapshot)}
        onApply={handleApplyAiActions}
        onSaveInbox={(text) => handleAddInboxItem({ title: text.slice(0, 80), content: text, source_type: 'idea' })}
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
