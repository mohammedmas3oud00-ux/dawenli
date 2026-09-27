import type { Task, VaultItem, WorshipDefinition, WorshipLog } from '../../types/hierarchical';
import { toLocalDateKey } from '../../utils/date';
import { worshipSummary } from '../../utils/ibadat';

export type DailyDestination = 'tasks' | 'inbox' | 'ibadat' | 'habits' | 'vaults' | 'timeblocking' | 'focus' | 'reviews';
export function DailyOverview({ tasks, vaults, definitions, logs, onNavigate }: { tasks: Task[]; vaults: VaultItem[]; definitions: WorshipDefinition[]; logs: WorshipLog[]; onNavigate: (destination: DailyDestination) => void }) {
  const today = toLocalDateKey();
  const due = tasks.filter((t) => t.due_date === today);
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'done').length;
  const worship = worshipSummary(definitions, logs, today);
  const learning = vaults.filter((v) => v.learning);
  const studied = learning.filter((v) => v.learning!.sessions.some((s) => s.date === today && s.units > 0)).length;
  const shortcuts: Array<[DailyDestination, string, string]> = [['tasks', 'مهامي', 'ما يستحق انتباهك'], ['inbox', 'صندوق الوارد', 'التقط أفكارك'], ['ibadat', 'عباداتي', 'الفرائض والأوراد'], ['habits', 'عاداتي', 'خطوات صغيرة ثابتة'], ['vaults', 'تعلّمي', 'الكتب والكورسات'], ['timeblocking', 'جدول اليوم', 'وزّع وقتك'], ['focus', 'جلسة تركيز', 'ابدأ التنفيذ'], ['reviews', 'مراجعاتي', 'تأمل تقدّمك']];
  return <section aria-label="نظرة على يومك" className="space-y-4 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div><p className="text-xs text-slate-500 dark:text-slate-400">{today}</p><h1 className="mt-1 text-2xl font-black">يومك في مكان واحد</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">ابدأ بما يهمك، وراجع تقدّمك دون التنقّل بين الصفحات.</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <button onClick={() => onNavigate('tasks')} className="rounded-2xl bg-slate-50 p-4 text-right dark:bg-slate-800"><span className="block text-sm">مهام موعدها اليوم</span><strong className="text-2xl">{due.filter((t) => t.status === 'done').length}/{due.length}</strong><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{overdue ? `${overdue} مهام متأخرة` : 'لا توجد مهام متأخرة'}</span></button>
      <button onClick={() => onNavigate('ibadat')} className="rounded-2xl bg-emerald-50 p-4 text-right dark:bg-emerald-950/30"><span className="block text-sm">عبادات اليوم المقررة</span><strong className="text-2xl">{worship.total ? `${worship.rate}%` : 'لا شيء مقرر'}</strong><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{worship.completed} من {worship.total} مكتملة — غير المقرر لا يخفض التقييم</span></button>
      <button onClick={() => onNavigate('vaults')} className="rounded-2xl bg-amber-50 p-4 text-right dark:bg-amber-950/30"><span className="block text-sm">التعلّم اليوم</span><strong className="text-2xl">{studied}</strong><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">كتب أو كورسات درست منها · {learning.filter((v) => v.learning!.completed < v.learning!.total).length} قيد المتابعة</span></button>
    </div>
    <nav aria-label="اختصارات يومية" className="grid grid-cols-2 gap-2 lg:grid-cols-4">{shortcuts.map(([destination, title, description]) => <button type="button" key={destination} onClick={() => onNavigate(destination)} className="min-w-0 rounded-xl border border-slate-200 p-3 text-right transition-colors hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:hover:bg-slate-800"><span className="block font-bold">{title}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{description}</span></button>)}</nav>
  </section>;
}
