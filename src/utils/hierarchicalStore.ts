/**
 * Hierarchical Productivity Engine (Pillars → Visions → Value Goals → Projects → Tasks)
 * Performs bottom-up automatic progress calculation mirroring PostgreSQL trigger logic.
 */

import { Pillar, Vision, ValueGoal, Project, Task, SystemReview } from '../types/hierarchical';
import { getInitialSeedReviews } from './reviewEngine';

const STORAGE_KEYS = {
  PILLARS: 'h_pillars_v2',
  VISIONS: 'h_visions_v2',
  VALUE_GOALS: 'h_value_goals_v2',
  PROJECTS: 'h_projects_v2',
  TASKS: 'h_tasks_v2',
  REVIEWS: 'h_reviews_v2',
};

// Initial Seed Data matching the user's life pillars
export const INITIAL_PILLARS: Pillar[] = [
  {
    id: 'pillar-1',
    title: 'العلاقة مع الله',
    description: 'الركن الأساسي والغاية الكبرى في الحياة والآخرة',
    pillar_group: 'Growth',
    purpose: 'ترسيخ العبودية الخالصة لله عز وجل، والاستقامة على أمره، والتزود بالعلم النافع والعمل الصالح لنيل رضاه والفوز بالدارين.',
    priority: 1,
    show_on_home: true,
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pillar-2',
    title: 'بناء الذات وتطوير المهارات',
    description: 'تزكية النفس وبناء العقل وصقل الهوية الشخصية',
    pillar_group: 'Growth',
    purpose: 'صقل الهوية الفكرية واكتساب الحكمة والمعارف الحياتية والتقنية لتكوين شخصية واعية قادرة على العطاء والأثر المستمر.',
    priority: 2,
    show_on_home: true,
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pillar-3',
    title: 'الصحة والجسد',
    description: 'المحافظة على الطاقة والنشاط والوقاية البدنية',
    pillar_group: 'Vitality',
    purpose: 'الحفاظ على طاقة الجسد وقوته ولياقته ليكون وعاءً صالحاً لأداء الواجبات والعيش بصفاء ذهني وإنتاجية عالية.',
    priority: 3,
    show_on_home: true,
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pillar-4',
    title: 'العمل والمسار المهني',
    description: 'الإتقان والابتكار في المشاريع وبناء السمعة المهنية',
    pillar_group: 'Impact',
    purpose: 'بناء مسار مهني استثنائي يقوم على الإتقان والابتكار البرمجي وتقديم حلول ذات قيمة حقيقية تدوم وتؤثر.',
    priority: 4,
    show_on_home: true,
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pillar-5',
    title: 'المال والاستثمار',
    description: 'الأمان المالي والإنفاق الرشيد والاستثمار المستدام',
    pillar_group: 'Wealth',
    purpose: 'تحقيق الاستقلال المالي والحرية المالية وتنمية الأصول وفق الضوابط الرشيدة للتمكن من الإنفاق في وجوه البر.',
    priority: 5,
    show_on_home: true,
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_VISIONS: Vision[] = [
  {
    id: 'vis-1',
    pillar_id: 'pillar-1',
    title: 'الرسوخ الإيماني وفهم الوحي وتزكية النفس',
    description: 'تحقيق صلة يومية حية بالقرآن الكريم والسنة النبوية، وتجسيد العبادة في سائر شؤون الحياة.',
    timeframe: 'أفق مستمر (2026-2030)',
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'vis-2',
    pillar_id: 'pillar-2',
    title: 'تكوين عقلية مهندس أنظمة قيادي وصاحب بصيرة',
    description: 'امتلاك المعرفة المعمارية العميقة والقدرة على بناء وتطوير حلول برمجية ومشاريع متطورة بأعلى درجات الجودة.',
    timeframe: '3 سنوات (2026-2028)',
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'vis-3',
    pillar_id: 'pillar-3',
    title: 'حيوية بدنية مستدامة ونوم منضبط وطاقة نقية',
    description: 'جسم رشيق، لياقة قلبية وتنفسية عالية، ومناعة قوية تدعم أعباء العمل الفكري والروحي.',
    timeframe: 'مستمر',
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'vis-4',
    pillar_id: 'pillar-4',
    title: 'إطلاق منتجات برمجية ذات تأثير وصناعة سمعة تقنية استثنائية',
    description: 'بناء منتجات رقمية متكاملة تخدم آلاف المستخدمين، وتحقيق معايير الهندسة المرموقة عالمياً.',
    timeframe: '2026-2029',
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'vis-5',
    pillar_id: 'pillar-5',
    title: 'استقلال مالي وتدفقات استثمارية وتأمين مستقبلي',
    description: 'بناء محفظة أصول متنوعة ومصادر دخل متعددة تتيح الحرية الكاملة للتفرغ للإبداع والعمل النافع.',
    timeframe: '5 سنوات',
    status: 'active',
    progress: 0,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_VALUE_GOALS: ValueGoal[] = [
  // Under Pillar 1 / Vision 1: العلاقة مع الله
  {
    id: 'goal-1',
    pillar_id: 'pillar-1',
    vision_id: 'vis-1',
    title: 'الفقه في الدين وحفظ سورتي البقرة وآل عمران',
    description: 'حفظ متقن مع فهم المعاني وتدبر الآيات وتطبيق الأحكام',
    status: 'in_progress',
    target_date: '2026-12-31',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    pillar_id: 'pillar-1',
    vision_id: 'vis-1',
    title: 'المحافظة على صلاة الجماعة والسنن الرواتب',
    description: 'حضور تكبيرة الإحرام والمحافظة على النوافل والأذكار اليومية',
    status: 'in_progress',
    target_date: null,
    progress: 0,
    created_at: new Date().toISOString(),
  },

  // Under Pillar 2 / Vision 2: بناء الذات
  {
    id: 'goal-3',
    pillar_id: 'pillar-2',
    vision_id: 'vis-2',
    title: 'إتقان هندسة النظم السحابية والبرمجيات المعمارية',
    description: 'دراسة وتطبيق أفضل الممارسات في بناء الأنظمة القابلة للتوسع',
    status: 'in_progress',
    target_date: '2026-10-30',
    progress: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'goal-4',
    pillar_id: 'pillar-2',
    vision_id: 'vis-2',
    title: 'إنهاء قراءة 12 كتاباً تأسيسياً في الفكر والإدارة',
    description: 'كتاب شهرياً مع تلخيص الفوائد وتدوينها في المستودع',
    status: 'in_progress',
    target_date: '2026-12-31',
    progress: 0,
    created_at: new Date().toISOString(),
  },

  // Under Pillar 4 / Vision 4: العمل والمسار المهني
  {
    id: 'goal-5',
    pillar_id: 'pillar-4',
    vision_id: 'vis-4',
    title: 'إطلاق الإصدار الإنتاجي من نظام Personal OS',
    description: 'نظام إدارة المشاريع المتكامل وحساب التقدم التلقائي',
    status: 'in_progress',
    target_date: '2026-09-30',
    progress: 0,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_PROJECTS: Project[] = [
  // Under Goal 1
  {
    id: 'proj-1',
    goal_id: 'goal-1',
    title: 'مشروع الختمة الشهرية والورد اليومي المرتل',
    description: 'قراءة جزء يومياً مع تفسير الكلمات الغريبة',
    status: 'in_progress',
    progress: 0,
    start_date: '2026-09-01',
    due_date: '2026-09-30',
    created_at: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    goal_id: 'goal-1',
    title: 'حفظ النصف الأول من سورة البقرة',
    description: 'حفظ متقن 142 آية بمعدل صفحة يومياً',
    status: 'in_progress',
    progress: 0,
    start_date: '2026-09-10',
    due_date: '2026-10-15',
    created_at: new Date().toISOString(),
  },

  // Under Goal 3
  {
    id: 'proj-3',
    goal_id: 'goal-3',
    title: 'معمارية قواعد البيانات PostgreSQL وتطوير الـ Triggers',
    description: 'تنفيذ كامل لطبقة البيانات RLS ومحفزات الحساب التلقائي',
    status: 'in_progress',
    progress: 0,
    start_date: '2026-09-15',
    due_date: '2026-09-28',
    created_at: new Date().toISOString(),
  },

  // Under Goal 5
  {
    id: 'proj-4',
    goal_id: 'goal-5',
    title: 'بناء واجهات التصفح الهرمية ونظام Breadcrumbs',
    description: 'تنقل تفصيلي من الركائز إلى المهام مع استجابة تامة',
    status: 'in_progress',
    progress: 0,
    start_date: '2026-09-20',
    due_date: '2026-09-25',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_TASKS: Task[] = [
  // Under Project 1 (مشروع الختمة)
  {
    id: 'task-1',
    project_id: 'proj-1',
    title: 'تثبيت تطبيق المصحف وتحديد وقت الفجر للورد',
    description: 'تخصيص نصف ساعة بعد صلاة الفجر مباشرة',
    status: 'done',
    priority: 'high',
    due_date: '2026-09-15',
    completed_at: '2026-09-15T06:30:00Z',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-2',
    project_id: 'proj-1',
    title: 'قراءة الجزء الثالث والعشرين وتدوين 3 وقفات تدبر',
    description: 'تدوين الوقفات في دفتر الملاحظات الشخصي',
    status: 'done',
    priority: 'medium',
    due_date: '2026-09-23',
    completed_at: '2026-09-23T08:00:00Z',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-3',
    project_id: 'proj-1',
    title: 'قراءة الجزء الرابع والعشرين والاطلاع على التفسير الميسر',
    description: 'المتابعة اليومية للورد القرآني',
    status: 'todo',
    priority: 'high',
    due_date: '2026-09-24',
    completed_at: null,
    created_at: new Date().toISOString(),
  },

  // Under Project 2 (حفظ سورة البقرة)
  {
    id: 'task-4',
    project_id: 'proj-2',
    title: 'تسميع الربع الأول للشيخ وضبط مخارج الحروف',
    description: 'من الآية 1 إلى الآية 25',
    status: 'done',
    priority: 'high',
    due_date: '2026-09-18',
    completed_at: '2026-09-18T17:00:00Z',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-5',
    project_id: 'proj-2',
    title: 'حفظ ومراجعة الربع الثاني (الآيات 26-43)',
    description: 'تكرار الآيات في صلاة قيام الليل',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-09-25',
    completed_at: null,
    created_at: new Date().toISOString(),
  },

  // Under Project 3 (معمارية قواعد البيانات)
  {
    id: 'task-6',
    project_id: 'proj-3',
    title: 'كتابة ملف DDL لجداول public.pillars و value_goals',
    description: 'تحديد المفاتيح الأساسية والخارجية وقيود النزاهة',
    status: 'done',
    priority: 'high',
    due_date: '2026-09-21',
    completed_at: '2026-09-21T14:00:00Z',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-7',
    project_id: 'proj-3',
    title: 'كتابة محفزات PostgreSQL للحساب التلقائي الصاعد (Triggers)',
    description: 'دوال plpgsql: recalculate_project_progress, recalculate_value_goal_progress, recalculate_pillar_progress',
    status: 'done',
    priority: 'high',
    due_date: '2026-09-22',
    completed_at: '2026-09-22T19:00:00Z',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-8',
    project_id: 'proj-3',
    title: 'تطبيق سياسات الأمان RLS الموجهة لمعرف المستخدم auth.uid()',
    description: 'فصل تام لبيانات المستخدمين على مستوى قاعدة البيانات',
    status: 'done',
    priority: 'high',
    due_date: '2026-09-23',
    completed_at: '2026-09-23T11:00:00Z',
    created_at: new Date().toISOString(),
  },

  // Under Project 4 (واجهات التصفح الهرمي)
  {
    id: 'task-9',
    project_id: 'proj-4',
    title: 'تصميم بطاقات الركائز مع مؤشر النجوم وعرض الغاية Purpose',
    description: 'عرض واضح لـ pillar_group والأولوية وشريط التقدم',
    status: 'done',
    priority: 'high',
    due_date: '2026-09-23',
    completed_at: '2026-09-23T13:00:00Z',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-10',
    project_id: 'proj-4',
    title: 'بناء نظام مسار التنقل Breadcrumbs عند التعمق في المستويات',
    description: 'Pillars > Vision > ValueGoal > Project > Tasks',
    status: 'done',
    priority: 'medium',
    due_date: '2026-09-23',
    completed_at: '2026-09-23T14:30:00Z',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-11',
    project_id: 'proj-4',
    title: 'بناء التبويب الجانبي وزر الإضافة السريعة من الأعلى',
    description: 'تنقل مرن بين الركائز والرؤى والأهداف والمشاريع والمهام',
    status: 'done',
    priority: 'high',
    due_date: '2026-09-24',
    completed_at: '2026-09-23T15:00:00Z',
    created_at: new Date().toISOString(),
  },
];

/**
 * Bottom-up progress rollup calculation
 * Chain: Task (100 if done) → Project (avg of tasks) → ValueGoal (avg of projects) → Vision (avg of goals) → Pillar (avg of visions or goals)
 */
export function recalculateAllHierarchicalProgress(
  pillars: Pillar[],
  visions: Vision[],
  goals: ValueGoal[],
  projects: Project[],
  tasks: Task[]
): {
  pillars: Pillar[];
  visions: Vision[];
  goals: ValueGoal[];
  projects: Project[];
  tasks: Task[];
} {
  // 1. Calculate Projects progress from Tasks
  const updatedProjects = projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.project_id === project.id);
    let progress = 0;
    if (projectTasks.length > 0) {
      const sum = projectTasks.reduce((acc, t) => acc + (t.status === 'done' ? 100 : 0), 0);
      progress = Math.round(sum / projectTasks.length);
    }
    const status = progress >= 100 ? 'completed' : project.status;
    return { ...project, progress, status };
  });

  // 2. Calculate Value Goals progress from Projects
  const updatedGoals = goals.map((goal) => {
    const goalProjects = updatedProjects.filter((p) => p.goal_id === goal.id);
    let progress = 0;
    if (goalProjects.length > 0) {
      const sum = goalProjects.reduce((acc, p) => acc + p.progress, 0);
      progress = Math.round(sum / goalProjects.length);
    }
    const status = progress >= 100 ? 'completed' : progress > 0 && goal.status === 'not_started' ? 'in_progress' : goal.status;
    return { ...goal, progress, status };
  });

  // 3. Calculate Visions progress from Value Goals
  const updatedVisions = visions.map((vision) => {
    const visionGoals = updatedGoals.filter((g) => g.vision_id === vision.id);
    let progress = 0;
    if (visionGoals.length > 0) {
      const sum = visionGoals.reduce((acc, g) => acc + g.progress, 0);
      progress = Math.round(sum / visionGoals.length);
    }
    return { ...vision, progress };
  });

  // 4. Calculate Pillars progress from Visions (or fallback directly to its Goals if no visions)
  const updatedPillars = pillars.map((pillar) => {
    const pillarVisions = updatedVisions.filter((v) => v.pillar_id === pillar.id);
    let progress = 0;
    if (pillarVisions.length > 0) {
      const sum = pillarVisions.reduce((acc, v) => acc + v.progress, 0);
      progress = Math.round(sum / pillarVisions.length);
    } else {
      const pillarGoals = updatedGoals.filter((g) => g.pillar_id === pillar.id);
      if (pillarGoals.length > 0) {
        const sum = pillarGoals.reduce((acc, g) => acc + g.progress, 0);
        progress = Math.round(sum / pillarGoals.length);
      }
    }
    return { ...pillar, progress };
  });

  return {
    pillars: updatedPillars,
    visions: updatedVisions,
    goals: updatedGoals,
    projects: updatedProjects,
    tasks,
  };
}

// Storage helpers
export function loadHierarchicalState() {
  try {
    const pStr = localStorage.getItem(STORAGE_KEYS.PILLARS);
    const vStr = localStorage.getItem(STORAGE_KEYS.VISIONS);
    const gStr = localStorage.getItem(STORAGE_KEYS.VALUE_GOALS);
    const prStr = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    const tStr = localStorage.getItem(STORAGE_KEYS.TASKS);

    const pillars: Pillar[] = pStr ? JSON.parse(pStr) : INITIAL_PILLARS;
    const visions: Vision[] = vStr ? JSON.parse(vStr) : INITIAL_VISIONS;
    const goals: ValueGoal[] = gStr ? JSON.parse(gStr) : INITIAL_VALUE_GOALS;
    const projects: Project[] = prStr ? JSON.parse(prStr) : INITIAL_PROJECTS;
    const tasks: Task[] = tStr ? JSON.parse(tStr) : INITIAL_TASKS;

    return recalculateAllHierarchicalProgress(pillars, visions, goals, projects, tasks);
  } catch (err) {
    console.error('Error loading hierarchical state:', err);
    return recalculateAllHierarchicalProgress(
      INITIAL_PILLARS,
      INITIAL_VISIONS,
      INITIAL_VALUE_GOALS,
      INITIAL_PROJECTS,
      INITIAL_TASKS
    );
  }
}

export function saveHierarchicalState(
  pillars: Pillar[],
  visions: Vision[],
  goals: ValueGoal[],
  projects: Project[],
  tasks: Task[]
) {
  try {
    localStorage.setItem(STORAGE_KEYS.PILLARS, JSON.stringify(pillars));
    localStorage.setItem(STORAGE_KEYS.VISIONS, JSON.stringify(visions));
    localStorage.setItem(STORAGE_KEYS.VALUE_GOALS, JSON.stringify(goals));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving hierarchical state:', err);
  }
}

export function loadReviewsState(
  pillars: Pillar[],
  visions: Vision[],
  goals: ValueGoal[],
  projects: Project[],
  tasks: Task[]
): SystemReview[] {
  try {
    const revStr = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (revStr) {
      return JSON.parse(revStr);
    }
    const initial = getInitialSeedReviews(pillars, visions, goals, projects, tasks);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(initial));
    return initial;
  } catch (err) {
    console.error('Error loading reviews state:', err);
    return getInitialSeedReviews(pillars, visions, goals, projects, tasks);
  }
}

export function saveReviewsState(reviews: SystemReview[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  } catch (err) {
    console.error('Error saving reviews state:', err);
  }
}

