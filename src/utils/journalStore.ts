import { JournalEntry, MoodType, EnergyLevel } from '../types/hierarchical';

const STORAGE_KEY = 'ppv_journal_v1';

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'journal-1',
    date: new Date().toISOString().split('T')[0],
    title: 'بداية أسبوع واعدة وتركيز على المخرجات الجوهرية',
    content: `بدأت اليوم بجلسة هادئة بعد صلاة الفجر، خصصت الساعات الأولى لصياغة هيكل المبادرات الجديدة في العمل. شعرت بتدفق ذهني عالٍ عندما أغلقت كافة الإشعارات وركزت في مشروع واحد لمدة ساعة ونصف متواصلة. 

في المساء، قمت بجولة مشي في الهواء الطلق ساعدتني على استعادة صفاء الذهن وتخفيف إجهاد الشاشات. غداً سأبدأ بمراجعة مسودات الموازنة والاتصال بالموردين.`,
    mood: 'great',
    energy_level: 'high',
    gratitude: [
      'نعمة الاستيقاظ المبكر بهدوء وطمأنينة',
      'الدعم الكبير من فريق العمل والأسرة',
      'القدرة على التركيز العميق وحماية الوقت',
    ],
    wins: [
      'إكمال المسودة الهندسية للمشروع في جلسة واحدة',
      'الالتزام بالمشي 45 دقيقة بدون تشتت',
    ],
    ai_summary: 'يوم استثنائي تكلل بتركيز عالٍ وإنجاز ملموس في الساعات المبكرة مع تحقيق توازن رياضي مسائي.',
    ai_insights: 'استثمار ساعات الصباح الباكرة في العمل العميق هو محركك الأقوى للإنتاجية؛ استمر في حماية هذا الوقت كأولوية مقدسة.',
    extracted_tasks: [
      { title: 'مراجعة مسودة موازنة الربع القادم مع المحاسب', priority: 'high', estimated_hours: 1.5 },
      { title: 'الاتصال بالموردين لتأكيد المواعيد النهائية', priority: 'medium', estimated_hours: 0.5 },
    ],
    voice_recorded: true,
    tags: ['تركيز_عميق', 'بداية_أسبوع', 'رياضة'],
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'journal-2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    title: 'تأملات في التبسيط والحد من تعدد المهام',
    content: `لاحظت اليوم أن القفز بين المهام يسرق الكثير من الطاقة الذهنية. قررت التوقف عن الرد الفوري على الرسائل غير العاجلة، وجمعت كل الردود في كتلة زمنية واحدة بعد الظهر. النتيجة كانت فورية: إنجاز أعلى وشعور مريح بالسيطرة.`,
    mood: 'calm',
    energy_level: 'medium',
    gratitude: [
      'الوعي بأهمية الانتباه والتركيز الأحادي',
      'كوب شاي دافئ وقراءة 20 صفحة في هدوء',
    ],
    wins: [
      'تطبيق تجميع المهام الإجرائية في كتلة زمنية واحدة',
      'تصفية صندوق الأفكار بنجاح',
    ],
    ai_summary: 'تجربة موفقة في تفادي التشتت وحماية الانتباه عبر تجميع المهام الإجرائية.',
    ai_insights: 'الإنتاجية الحقيقية ليست كثرة المشاغل، بل نقاء الاختيار وحزم الحماية من المقاطعات.',
    extracted_tasks: [
      { title: 'تخصيص نصف ساعة يومية لمعالجة صندوق الوارد دفعة واحدة', priority: 'medium', estimated_hours: 0.5 }
    ],
    voice_recorded: false,
    tags: ['تركيز', 'هدوء', 'تنظيم'],
    created_at: new Date(Date.now() - 86400000 - 3600000 * 5).toISOString(),
  },
];

export function loadJournalEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_JOURNAL_ENTRIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_JOURNAL_ENTRIES;
  } catch (err) {
    console.error('Error loading journal entries:', err);
    return INITIAL_JOURNAL_ENTRIES;
  }
}

export function saveJournalEntries(entries: JournalEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Error saving journal entries:', err);
  }
}
