import type { WorshipDefinition } from '../types/hierarchical';

export const worshipSections = [
  { category: 'salah', title: 'الصلوات المفروضة', description: 'الفجر ← الظهر ← العصر ← المغرب ← العشاء' },
  { category: 'sunnah_rawatib', title: 'السنن الرواتب', description: 'تتبّع مستقل عن أداء الفرائض' },
  { category: 'quran_wird', title: 'ورد القرآن', description: 'قراءة يومية وتدرّج حسب قدرتك' },
  { category: 'quran_hifz', title: 'الحفظ والمراجعة', description: 'ثبّت ما حفظته خطوة بخطوة' },
  { category: 'adhkar', title: 'الأذكار', description: 'أذكار الصباح ثم المساء' },
  { category: 'fasting', title: 'الصيام', description: 'البداية بالاثنين والخميس، ثم توسّع باختيارك' },
  { category: 'qiyam', title: 'قيام الليل', description: 'الركعات ووقت الأداء' },
  { category: 'sadaqah', title: 'الصدقة', description: 'المبلغ اختياري وخاص' },
  { category: 'custom_dua', title: 'الأوراد الخاصة', description: 'مساحتك للأوراد التي تختارها' },
] as const;

export function sortWorshipDefinitions(items: WorshipDefinition[]) {
  const times = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'morning', 'evening', 'night', 'anytime'];
  const names = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
  const rank = (item: WorshipDefinition) => {
    const value = item.time_of_day ? times.indexOf(item.time_of_day) : names.indexOf(item.title);
    return value < 0 ? 99 : value;
  };
  return [...items].sort((a, b) => rank(a) - rank(b) || a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}
