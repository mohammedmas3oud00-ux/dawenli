import { FocusSessionRecord, TimeBlock, Task, Project, Pillar } from '../types/hierarchical';

const STORAGE_KEYS = {
  FOCUS_SESSIONS: 'ppv_focus_sessions_v1',
  TIME_BLOCKS: 'ppv_time_blocks_v1',
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

export const getInitialTimeBlocks = (tasks: Task[], projects: Project[], pillars: Pillar[]): TimeBlock[] => {
  const today = getTodayStr();
  const t1 = tasks[0];
  const t2 = tasks[1];
  const t3 = tasks[2];

  return [
    {
      id: 'tb-1',
      date: today,
      start_time: '08:30',
      end_time: '10:00',
      title: t1 ? t1.title : 'جلسة تركيز عميق: المعمارية والتصميم',
      task_id: t1?.id || null,
      project_id: t1?.project_id || projects[0]?.id || null,
      pillar_id: pillars[0]?.id || null,
      category: 'deep_work',
      color: '#174235',
      is_completed: true,
      notes: 'إنجاز مرحلة هامة بدون أي تشتت أو إشعارات',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tb-2',
      date: today,
      start_time: '10:15',
      end_time: '11:15',
      title: 'مراجعة المهام الإجرائية والبريد وصندوق الوارد',
      category: 'shallow_work',
      color: '#0284c7',
      is_completed: true,
      notes: 'تصفية الوارد السريع وتنظيم التكليفات',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tb-3',
      date: today,
      start_time: '11:30',
      end_time: '13:00',
      title: t2 ? t2.title : 'تنفيذ المهام الاستراتيجية للمشروع',
      task_id: t2?.id || null,
      project_id: t2?.project_id || projects[1]?.id || null,
      pillar_id: pillars[1]?.id || null,
      category: 'deep_work',
      color: '#174235',
      is_completed: false,
      notes: 'التركيز على مخرجات عالية القيمة',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tb-4',
      date: today,
      start_time: '14:00',
      end_time: '14:45',
      title: 'استراحة وتأمل ومراجعة منتصف اليوم',
      category: 'rest',
      color: '#84cc16',
      is_completed: false,
      notes: 'تجديد النشاط والابتعاد عن الشاشات',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tb-5',
      date: today,
      start_time: '15:00',
      end_time: '16:30',
      title: t3 ? t3.title : 'قراءة وبحث توثيقي في الخزائن',
      task_id: t3?.id || null,
      project_id: t3?.project_id || null,
      pillar_id: pillars[2]?.id || null,
      category: 'learning',
      color: '#7c3aed',
      is_completed: false,
      notes: 'استخلاص نقاط محورية وإضافتها لخزينة المعرفة',
      created_at: new Date().toISOString(),
    },
  ];
};

export const getInitialFocusSessions = (tasks: Task[]): FocusSessionRecord[] => {
  const today = getTodayStr();
  const t1 = tasks[0];

  return [
    {
      id: 'fs-1',
      task_id: t1?.id || null,
      task_title: t1 ? t1.title : 'تصميم واجهة المستخدم الهرمية',
      project_title: 'نظام داونلي للإنتاجية',
      mode: 'pomodoro',
      duration_seconds: 25 * 60,
      date: today,
      completed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      distractions_count: 0,
      notes: 'جلسة تركيز كاملة وناجحة بنسبة 100%',
    },
    {
      id: 'fs-2',
      task_id: null,
      task_title: 'تدفق حر: كتابة الكود وبناء المنطق البرمجي',
      project_title: 'التطوير البرمجي',
      mode: 'flowtime',
      duration_seconds: 42 * 60,
      break_seconds: 10 * 60,
      date: today,
      completed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      distractions_count: 1,
      notes: 'اندماج عميق في حل المشكلات بدون مقاطعة',
    },
  ];
};

export function loadFocusSessions(tasks: Task[] = []): FocusSessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
    if (!raw) {
      const initial = getInitialFocusSessions(tasks);
      localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading focus sessions', err);
    return [];
  }
}

export function saveFocusSession(session: FocusSessionRecord): FocusSessionRecord[] {
  try {
    const current = loadFocusSessions();
    const updated = [session, ...current];
    localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving focus session', err);
    return [];
  }
}

export function loadTimeBlocks(tasks: Task[] = [], projects: Project[] = [], pillars: Pillar[] = []): TimeBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIME_BLOCKS);
    if (!raw) {
      const initial = getInitialTimeBlocks(tasks, projects, pillars);
      localStorage.setItem(STORAGE_KEYS.TIME_BLOCKS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading time blocks', err);
    return [];
  }
}

export function saveTimeBlocks(blocks: TimeBlock[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TIME_BLOCKS, JSON.stringify(blocks));
  } catch (err) {
    console.error('Error saving time blocks', err);
  }
}
