import { useState } from 'react';
import type { WorshipDefinition } from '../../types/hierarchical';

export function WorshipPreferences({ definition, onSave }: { definition: WorshipDefinition; onSave: (id: string, patch: Partial<WorshipDefinition>) => void }) {
  const [weekdays, setWeekdays] = useState(definition.scheduled_days ?? [1, 4]);
  const [whiteDays, setWhiteDays] = useState((definition.scheduled_hijri_days ?? []).length > 0);
  const [target, setTarget] = useState(definition.category === 'quran_wird' ? Math.max(1, Math.ceil((definition.target_pages || 5) / 5)) : definition.target_count || 2);
  const [saved, setSaved] = useState(false);
  const [duration, setDuration] = useState(definition.progression_days || 30);
  if (!['fasting', 'quran_wird', 'qiyam'].includes(definition.category)) return null;
  return <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
    <summary className="cursor-pointer text-sm font-bold">إعداد الهدف والتقييم</summary>
    <div className="mt-3 space-y-3 text-sm">
      {definition.category === 'fasting' ? <>
        <p className="text-slate-600 dark:text-slate-300">لن يدخل الصيام في تقييمك إلا في الأيام المحددة هنا.</p>
        <label className="flex items-center gap-2"><input type="checkbox" checked={weekdays.includes(1) && weekdays.includes(4)} onChange={(e) => { setWeekdays(e.target.checked ? [1, 4] : []); setSaved(false); }} />الاثنين والخميس</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={whiteDays} onChange={(e) => { setWhiteDays(e.target.checked); setSaved(false); }} />الأيام البيض: 13 و14 و15 هجريًا</label>
        <p className="text-xs text-slate-500">يمكن اختيار الاثنين معًا. التاريخ الهجري محسوب وقد يختلف عن الرؤية المحلية.</p>
      </> : <label className="flex flex-wrap items-center gap-2">{definition.category === 'quran_wird' ? 'الهدف اليومي بأرباع الجزء' : 'هدف قيام الليل بالركعات'}
        <input aria-label={`هدف ${definition.title}`} type="number" min="1" max={definition.category === 'quran_wird' ? 120 : 100} step="1" value={target} onChange={(e) => { setTarget(Number(e.target.value)); setSaved(false); }} className="w-20 rounded-lg border p-2 dark:border-slate-600 dark:bg-slate-900" />
      </label>}
      {definition.category === 'quran_wird' && <p className="text-xs text-slate-500">ربع جزء ≈ 5 صفحات. سنعرض التتبّع بالأرباع مع الحفاظ على سجلات الصفحات القديمة.</p>}
      {definition.category !== 'fasting' && <label className="flex flex-wrap items-center gap-2">أيام الاستمرار قبل اقتراح الزيادة<input aria-label="مدة التدرج بالأيام" type="number" min="1" max="365" value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setSaved(false); }} className="w-20 rounded-lg border p-2 dark:border-slate-600 dark:bg-slate-900" /></label>}
      <button type="button" disabled={definition.category !== 'fasting' && (!Number.isInteger(duration) || duration < 1 || duration > 365 || !Number.isInteger(target) || target < 1 || target > (definition.category === 'quran_wird' ? 120 : 100))} onClick={() => {
        onSave(definition.id, definition.category === 'fasting' ? { frequency: 'custom', scheduled_days: weekdays, scheduled_hijri_days: whiteDays ? [13, 14, 15] : [] } : definition.category === 'quran_wird' ? { target_pages: target * 5, progression_days: duration } : { target_count: target, progression_days: duration }); setSaved(true);
      }} className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-50">تطبيق الإعدادات</button>
      {saved && <p role="status" className="text-xs text-slate-600 dark:text-slate-300">تم تطبيق الاختيار؛ تابع حالة المزامنة لتأكيد الحفظ السحابي.</p>}
    </div>
  </details>;
}
