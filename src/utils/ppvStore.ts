import { InboxItem, Habit, VaultItem, Pillar } from '../types/hierarchical';

const STORAGE_KEYS = {
  INBOX: 'ppv_inbox_v1',
  HABITS: 'ppv_habits_v1',
  VAULTS: 'ppv_vaults_v1',
};

// Date helpers
const getTodayStr = () => new Date().toISOString().split('T')[0];

const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_INBOX: InboxItem[] = [
  {
    id: 'inbox-1',
    title: 'فكرة: دمج تقنيات التفكير المنظومي في جدولة مواعيد العمل',
    content: 'استخدام أسلوب الـ Time Blocking مع ربط كل قالب زمني بهدف قيمة محدد في بداية كل أسبوع.',
    source_type: 'idea',
    status: 'inbox',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'inbox-2',
    title: 'تجديد الاشتراك في أداة الاستضافة السحابية',
    content: 'التأكد من تحديث بطاقة الدفع قبل نهاية الشهر لتجنب توقف المشاريع التجريبية.',
    source_type: 'task_seed',
    status: 'inbox',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'inbox-3',
    title: 'مرجع ممتاز: مقال حول الفرق بين أهداف الأداء وأهداف النتيجة',
    content: 'يركز على أن أهداف النتيجة خارجة عن سيطرتك التامة، بينما عاداتك وأهداف الأداء تحت تحكمك 100%.',
    source_type: 'reference',
    url: 'https://jamesclear.com',
    status: 'inbox',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export const getInitialHabits = (pillars: Pillar[]): Habit[] => {
  const pGod = pillars.find(p => p.title.includes('الله'))?.id || pillars[0]?.id || 'pillar-1';
  const pSelf = pillars.find(p => p.title.includes('الذات'))?.id || pillars[1]?.id || 'pillar-2';
  const pHealth = pillars.find(p => p.title.includes('الصحة'))?.id || pillars[2]?.id || 'pillar-3';
  const pWork = pillars.find(p => p.title.includes('العمل'))?.id || pillars[3]?.id || 'pillar-4';

  const today = getTodayStr();
  const yesterday = getPastDateStr(1);
  const twoDaysAgo = getPastDateStr(2);
  const threeDaysAgo = getPastDateStr(3);

  return [
    {
      id: 'habit-1',
      pillar_id: pGod,
      title: 'صلاة الفجر في المسجد وأذكار الصباح',
      description: 'البداية الروحية الأساسية اليومية لشحن الطاقة والبركة والسكينة.',
      frequency: 'daily',
      target_days_per_week: 7,
      time_of_day: 'morning',
      current_streak: 12,
      longest_streak: 28,
      completed_dates: [today, yesterday, twoDaysAgo, threeDaysAgo],
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 'habit-2',
      pillar_id: pSelf,
      title: 'قراءة 20 صفحة في كتاب معرفي / فكري',
      description: 'تغذية العقل وتوسيع المدارك قبل النوم أو في الفترة الصباحية.',
      frequency: 'daily',
      target_days_per_week: 7,
      time_of_day: 'evening',
      current_streak: 5,
      longest_streak: 19,
      completed_dates: [yesterday, twoDaysAgo, threeDaysAgo],
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 'habit-3',
      pillar_id: pHealth,
      title: 'تمرين بدني / لياقة أو مشي 45 دقيقة',
      description: 'صيانة الجسد وضخ الطاقة والوقاية من الخمول المكتبي.',
      frequency: 'weekdays',
      target_days_per_week: 5,
      time_of_day: 'afternoon',
      current_streak: 4,
      longest_streak: 14,
      completed_dates: [yesterday, twoDaysAgo],
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: 'habit-4',
      pillar_id: pWork,
      title: 'جلسة عمل عميق بدون مشتتات (90 دقيقة)',
      description: 'إغلاق الإشعارات والانغماس في المخرج الأهم في المشروع القائم.',
      frequency: 'weekdays',
      target_days_per_week: 5,
      time_of_day: 'morning',
      current_streak: 8,
      longest_streak: 15,
      completed_dates: [today, yesterday, twoDaysAgo],
      is_active: true,
      created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    },
  ];
};

export const getInitialVaultItems = (pillars: Pillar[]): VaultItem[] => {
  const pSelf = pillars.find(p => p.title.includes('الذات'))?.id || pillars[1]?.id || 'pillar-2';
  const pWork = pillars.find(p => p.title.includes('العمل'))?.id || pillars[3]?.id || 'pillar-4';

  return [
    {
      id: 'vault-1',
      pillar_id: pSelf,
      title: 'كتاب: العادات الذرية (Atomic Habits) — جيمس كلير',
      vault_type: 'books',
      summary: 'دليل عملي لتغيير السلوك البشري عبر تراكم التحسينات الطفيفة بنسبة 1% يومياً.',
      content: `النقاط الجوهرية:
1. لا ترتقي لمستوى أهدافك، بل تهبط لمستوى أنظمتك.
2. الهوية هي الدافع الأقوى: ركّز على الشخص الذي ترغب أن تكونه وليس فقط النتيجة المادية.
3. القوانين الأربعة لتغيير السلوك: اجعلها واضحة، جذابة، سهلة، ومشبعة.`,
      author_or_source: 'James Clear',
      tags: ['تطوير ذات', 'علم نفس السلوك', 'عادات', 'إنتاجية'],
      rating: 5,
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'vault-2',
      pillar_id: pSelf,
      title: 'مذكرة مبادئ: التفكير المنظومي في الحياة الشخصية (PPV Framework)',
      vault_type: 'notes',
      summary: 'ملخص لقواعد أوغست برادلي في بناء منظومة تشغيل شخصية تعتمد على التغذية الراجعة.',
      content: `العناصر المركزية:
- الركائز (Pillars): مجالات الحياة الدائمة التي لا تنتهي أبداً.
- خطوط التدفق (Pipelines): نقل النية من الرؤية إلى هدف القيمة، إلى المشروع، ثم إلى المهام اليومية.
- الخزائن (Vaults): قواعد البيانات المعرفية الداعمة للتنفيذ.
- حلقة التغذية الراجعة (Feedback Loop): المراجعات الدورية هي القلب النابض الذي يضمن التكيف السريع.`,
      author_or_source: 'August Bradley',
      tags: ['PPV', 'Systems Thinking', 'إدارة الحياة', 'Notion'],
      rating: 5,
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
    },
    {
      id: 'vault-3',
      pillar_id: pWork,
      title: 'مرجع: أفضل ممارسات تصميم واجهات الويب الهادئة (Quiet UI Design)',
      vault_type: 'resources',
      summary: 'أدلة ومعايير تصميم الواجهات بلغات ألوان طبيعية تركز على تقليل التلوث البصري.',
      content: `أهم المعايير:
- استخدام درجات الأوف وايت الدافئة (#FAF8F4) بدلاً من الأبيض الصارخ.
- الاعتماد على خط عربي واضح ومريح مثل Cairo و IBM Plex Sans Arabic.
- استخدام زوايا بيضاوية ناعمة (Rounded-2xl) لتوفير شعور بالسكينة أثناء التصفح.`,
      author_or_source: 'Dawenli Design System',
      tags: ['UI/UX', 'تصميم', 'Tailwind', 'هوية بصرية'],
      rating: 5,
      status: 'reference',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'vault-4',
      pillar_id: pWork,
      title: 'قالب تشغيلي: بروتوكول المراجعة الأسبوعية وإغلاق المشروعات',
      vault_type: 'templates',
      summary: 'خطوات تصفية الصندوق الوارد وتحديث بطاقات كانبان وفحص نسب التقدم الصاعد.',
      content: `1. تصفية صندوق الوارد (Inbox Zero) وتحويل كل فكرة إلى مهمة أو مرجع.
2. فحص المهام المتأخرة وإعادة جدولتها.
3. قياس نسب إنجاز المشروعات ومطابقتها مع أهداف القيمة.
4. تحديد أهم 3 التزامات للأسبوع القادم.`,
      author_or_source: 'GTD + PPV Synthesis',
      tags: ['قوالب', 'مراجعة أسبوعية', 'GTD', 'تشغيل'],
      rating: 5,
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
  ];
};

// Storage Load & Save Helpers
export function loadPPVState(pillars: Pillar[]) {
  try {
    const iStr = localStorage.getItem(STORAGE_KEYS.INBOX);
    const hStr = localStorage.getItem(STORAGE_KEYS.HABITS);
    const vStr = localStorage.getItem(STORAGE_KEYS.VAULTS);

    const inbox: InboxItem[] = iStr ? JSON.parse(iStr) : INITIAL_INBOX;
    const habits: Habit[] = hStr ? JSON.parse(hStr) : getInitialHabits(pillars);
    const vaults: VaultItem[] = vStr ? JSON.parse(vStr) : getInitialVaultItems(pillars);

    return { inbox, habits, vaults };
  } catch (err) {
    console.error('Error loading PPV state:', err);
    return {
      inbox: INITIAL_INBOX,
      habits: getInitialHabits(pillars),
      vaults: getInitialVaultItems(pillars),
    };
  }
}

export function saveInboxState(inbox: InboxItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(inbox));
  } catch (err) {
    console.error('Error saving inbox state:', err);
  }
}

export function saveHabitsState(habits: Habit[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (err) {
    console.error('Error saving habits state:', err);
  }
}

export function saveVaultsState(vaults: VaultItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.VAULTS, JSON.stringify(vaults));
  } catch (err) {
    console.error('Error saving vaults state:', err);
  }
}
