import React, { useMemo, useState } from 'react';
import { Check, Moon, Plus, Sparkles } from 'lucide-react';
import type { Pillar, WorshipDefinition, WorshipLog } from '../../types/hierarchical';
import { toLocalDateKey } from '../../utils/date';
import { isEditableWorshipDate, worshipStreak, worshipSummary } from '../../utils/ibadat';

type Props = {
  pillars: Pillar[]; definitions: WorshipDefinition[]; logs: WorshipLog[];
  onSetup: (categories: WorshipDefinition['category'][]) => void;
  onSaveLog: (log: WorshipLog) => void;
  onOpenTimeBlocking: () => void; onSuggestTimeBlocks: () => void;
};

const choices: Array<{ category: WorshipDefinition['category']; label: string }> = [
  { category: 'salah', label: 'الصلوات الخمس' }, { category: 'adhkar', label: 'أذكار الصباح والمساء' },
  { category: 'quran_wird', label: 'ورد القرآن والختمة' }, { category: 'qiyam', label: 'قيام الليل' },
  { category: 'fasting', label: 'صيام التطوع' }, { category: 'sadaqah', label: 'الصدقة' },
  { category: 'custom_dua', label: 'أوراد وأدعية مخصصة' }, { category: 'quran_hifz', label: 'حفظ القرآن ومراجعته' },
];

export const IbadatDashboard: React.FC<Props> = ({ pillars, definitions, logs, onSetup, onSaveLog, onOpenTimeBlocking, onSuggestTimeBlocks }) => {
  const [selected, setSelected] = useState(choices.slice(0, 4).map((item) => item.category));
  const [date, setDate] = useState(toLocalDateKey());
  const today = toLocalDateKey();
  const dayDefinitions = definitions.filter((item) => item.is_active && (item.frequency === 'daily' || item.frequency === 'custom'));
  const summary = useMemo(() => worshipSummary(definitions, logs, date), [definitions, logs, date]);
  if (!definitions.length) return <section className="max-w-3xl mx-auto rounded-3xl border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-slate-900 p-6 sm:p-10 text-center space-y-5">
    <Moon className="w-12 h-12 mx-auto text-emerald-700 dark:text-emerald-400" /><h1 className="text-2xl font-black">ابدأ منظومة عباداتك</h1>
    <p className="text-sm text-slate-600 dark:text-slate-300">سننشئ ركيزة «العلاقة مع الله» ونربط بها ما تختاره. يمكنك تعديل الاختيارات لاحقًا.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">{choices.map(({ category, label }) => <label key={category} className="flex gap-2 rounded-xl border p-3 cursor-pointer dark:border-slate-700"><input type="checkbox" checked={selected.includes(category)} onChange={() => setSelected((old) => old.includes(category) ? old.filter((x) => x !== category) : [...old, category])} />{label}</label>)}</div>
    <button type="button" disabled={!selected.length} onClick={() => onSetup(selected)} className="rounded-xl bg-emerald-700 text-white px-5 py-3 font-bold disabled:opacity-50">تفعيل العبادات المختارة</button>
  </section>;
  const save = (definition: WorshipDefinition, patch: Partial<WorshipLog>) => {
    if (!isEditableWorshipDate(date)) return;
    const prior = logs.find((log) => log.worship_id === definition.id && log.date === date);
    onSaveLog({ id: prior?.id || crypto.randomUUID(), worship_id: definition.id, date, is_completed: false, created_at: prior?.created_at || new Date().toISOString(), ...prior, ...patch, completed_at: patch.is_completed ? new Date().toISOString() : null });
  };
  const streak = worshipStreak(definitions, logs);
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">🕌 العبادات والأوراد</h1><p className="text-sm text-slate-500">مرتبطة بركيزة {pillars.find((p) => p.id === definitions[0].pillar_id)?.title || 'العلاقة مع الله'}</p></div><div className="flex gap-2"><button type="button" onClick={onSuggestTimeBlocks} className="rounded-xl bg-emerald-700 text-white px-3 py-2 text-sm">إضافة الكتل المقترحة</button><button type="button" onClick={onOpenTimeBlocking} className="rounded-xl border px-3 py-2 text-sm dark:border-slate-700">حجب الوقت</button></div></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Stat label="التزام اليوم" value={`${summary.rate}%`} /><Stat label="المكتمل" value={`${summary.completed}/${summary.total}`} /><Stat label="الستريك" value={`${streak} يوم`} /><Stat label="التاريخ" value={date} /></div>
    <div className="flex items-center gap-2"><label className="text-sm font-semibold">تسجيل يوم:</label><input aria-label="تاريخ سجل العبادة" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="rounded-lg border p-2 dark:bg-slate-800 dark:border-slate-700" />{!isEditableWorshipDate(date) && <span className="text-xs text-rose-600">التعديل متاح لآخر 30 يومًا فقط</span>}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{dayDefinitions.map((definition) => { const log = logs.find((item) => item.worship_id === definition.id && item.date === date); return <article key={definition.id} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"><div className="flex justify-between gap-3"><h2 className="font-bold">{definition.category === 'salah' ? '🕌' : definition.category === 'quran_wird' ? '📖' : '📿'} {definition.title}</h2><button aria-label={`تسجيل ${definition.title}`} disabled={!isEditableWorshipDate(date)} onClick={() => save(definition, { is_completed: !log?.is_completed })} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${log?.is_completed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800'}`}><Check className="inline w-4 h-4" /> {log?.is_completed ? 'تم' : 'تسجيل'}</button></div>
      {definition.category === 'salah' && <div className="flex flex-wrap gap-2"><select aria-label={`أداء ${definition.title}`} value={log?.performance || ''} onChange={(e) => save(definition, { performance: e.target.value as WorshipLog['performance'], is_completed: e.target.value === 'ada' || e.target.value === 'qada' })} className="rounded-lg border p-2 text-sm dark:bg-slate-800 dark:border-slate-700"><option value="">نوع الأداء</option><option value="ada">أداء</option><option value="qada">قضاء</option><option value="missed">فاتت</option></select><select aria-label={`جماعة ${definition.title}`} value={log?.congregation || ''} onChange={(e) => save(definition, { congregation: e.target.value as WorshipLog['congregation'] })} className="rounded-lg border p-2 text-sm dark:bg-slate-800 dark:border-slate-700"><option value="">جماعة / فرد</option><option value="jamaah">جماعة</option><option value="fard">فرد</option></select></div>}
      {definition.tracking_type === 'counter' && <div className="flex items-center gap-3"><button aria-label={`زيادة ${definition.title}`} onClick={() => save(definition, { count: (log?.count || 0) + 1, is_completed: (log?.count || 0) + 1 >= (definition.target_count || 1) })} className="rounded-full bg-emerald-700 text-white w-10 h-10"><Plus className="w-5 h-5 mx-auto" /></button><span>{log?.count || 0}/{definition.target_count || '—'}</span></div>}
      {definition.tracking_type === 'pages' && <input aria-label={`صفحات ${definition.title}`} type="number" min="0" value={log?.pages_read || ''} onChange={(e) => { const pages = Number(e.target.value); save(definition, { pages_read: pages, is_completed: pages >= (definition.target_pages || 1) }); }} className="w-28 rounded-lg border p-2 dark:bg-slate-800 dark:border-slate-700" />}
      {definition.tracking_type === 'amount' && <input aria-label={`مبلغ ${definition.title}`} type="number" min="0" placeholder="مبلغ اختياري خاص" value={log?.amount || ''} onChange={(e) => save(definition, { amount: Number(e.target.value) || null, is_completed: Boolean(e.target.value) })} className="w-44 rounded-lg border p-2 text-sm dark:bg-slate-800 dark:border-slate-700" />}
      {definition.category === 'qiyam' && <div className="flex gap-2"><input aria-label="عدد ركعات قيام الليل" type="number" min="1" placeholder="الركعات" value={log?.rakaat_count || ''} onChange={(e) => save(definition, { rakaat_count: Number(e.target.value) || null, is_completed: Number(e.target.value) > 0 })} className="w-28 rounded-lg border p-2 dark:bg-slate-800 dark:border-slate-700" /><input aria-label="وقت قيام الليل" type="time" value={log?.performed_at_time || ''} onChange={(e) => save(definition, { performed_at_time: e.target.value || null })} className="rounded-lg border p-2 dark:bg-slate-800 dark:border-slate-700" /></div>}
    </article>; })}</div>
    <p className="text-xs text-slate-500 flex gap-1 items-center"><Sparkles className="w-3 h-3" />الذكاء الاصطناعي يعرض تحليلات وتشجيعًا فقط، ولا يصدر أحكامًا أو فتاوى.</p>
  </section>;
};
const Stat = ({ label, value }: { label: string; value: string }) => <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4"><p className="text-xs text-slate-500">{label}</p><p className="font-black text-lg">{value}</p></div>;
