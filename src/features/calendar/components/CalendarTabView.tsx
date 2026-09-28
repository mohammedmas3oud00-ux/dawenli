import { useMemo, useState } from 'react';
import { Bell, CalendarDays, Clock3, Pencil, Plus, Repeat2, Trash2, X } from 'lucide-react';
import type { CalendarEvent, CalendarRecurrenceFrequency, Pillar, Project, Task } from '../../../types/hierarchical';
import { toLocalDateKey } from '../../../utils/date';

interface Props {
  events: CalendarEvent[];
  pillars: Pillar[];
  projects: Project[];
  tasks: Task[];
  onSave(event: Partial<CalendarEvent>): void;
  onDelete(event: CalendarEvent): void;
  onEnableNotifications(): void;
  onConnectGoogle(): void;
  onSyncGoogle(): void;
  googleConnected?: boolean;
  syncingGoogle?: boolean;
}

const recurrenceLabels: Record<CalendarRecurrenceFrequency, string> = { none: 'مرة واحدة', daily: 'يوميًا', weekly: 'أسبوعيًا', monthly: 'شهريًا' };
const dayLabels = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const localParts = (iso?: string | null) => {
  const date = iso ? new Date(iso) : new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return { date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, time: `${pad(date.getHours())}:${pad(date.getMinutes())}` };
};
const toIso = (date: string, time: string, allDay: boolean) => new Date(`${date}T${allDay ? '00:00' : time}:00`).toISOString();

export function CalendarTabView({ events, pillars, projects, tasks, onSave, onDelete, onEnableNotifications, onConnectGoogle, onSyncGoogle, googleConnected = false, syncingGoogle = false }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toLocalDateKey());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [frequency, setFrequency] = useState<CalendarRecurrenceFrequency>('none');
  const [interval, setInterval] = useState(1);
  const [days, setDays] = useState<number[]>([]);
  const [until, setUntil] = useState('');
  const [reminder, setReminder] = useState('15');
  const [pillarId, setPillarId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [formError, setFormError] = useState('');

  const sorted = useMemo(() => [...events].filter((event) => !event.is_cancelled).sort((a, b) => a.start_at.localeCompare(b.start_at)), [events]);
  const showForm = (event?: CalendarEvent) => {
    const start = event ? localParts(event.start_at) : { date: toLocalDateKey(), time: '09:00' };
    const end = event ? localParts(event.end_at || new Date(new Date(event.start_at).getTime() + 3600000).toISOString()) : { date: toLocalDateKey(), time: '10:00' };
    setFormError('');
    setEditing(event || null); setTitle(event?.title || ''); setDescription(event?.description || ''); setDate(start.date);
    setStartTime(start.time); setEndTime(end.time); setAllDay(event?.all_day || false); setFrequency(event?.recurrence.frequency || 'none');
    setInterval(event?.recurrence.interval || 1); setDays(event?.recurrence.days_of_week || []); setUntil(event?.recurrence.until || '');
    setReminder(event?.reminder_minutes == null ? '' : String(event.reminder_minutes)); setPillarId(event?.pillar_id || ''); setProjectId(event?.project_id || ''); setTaskId(event?.task_id || ''); setOpen(true);
  };
  const submit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    const startAt = toIso(date, startTime, allDay);
    const endAt = allDay ? new Date(new Date(startAt).getTime() + 86400000).toISOString() : toIso(date, endTime, false);
    if (!title.trim()) { setFormError('أدخل عنوان الموعد.'); return; }
    if (new Date(endAt) <= new Date(startAt)) { setFormError('يجب أن يكون وقت النهاية بعد وقت البداية.'); return; }
    setFormError('');
    onSave({ ...(editing ? { id: editing.id, created_at: editing.created_at } : {}), title: title.trim(), description: description.trim(), start_at: startAt, end_at: endAt, all_day: allDay,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo', recurrence: { frequency, interval: Math.max(1, interval), days_of_week: frequency === 'weekly' ? days : [], until: until || null },
      reminder_minutes: reminder === '' ? null : Math.max(0, Number(reminder)), pillar_id: pillarId || null, project_id: projectId || null, task_id: taskId || null, is_cancelled: false });
    setOpen(false);
  };

  return <div className="mx-auto max-w-5xl space-y-4">
    <div className="rounded-2xl border border-[#e8e4db] bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-sky-50 p-2 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><CalendarDays className="h-5 w-5" /></div><div><h1 className="font-bold">التقويم</h1><p className="text-xs text-slate-500">مواعيد منفردة أو متكررة مرتبطة بمهامك ومشروعاتك.</p></div></div><div className="flex gap-2"><button onClick={onEnableNotifications} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold dark:border-slate-700"><Bell className="h-4 w-4" />تفعيل التذكير</button><button onClick={onConnectGoogle} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${googleConnected ? 'border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300' : 'border-blue-200 text-blue-700 dark:border-blue-900 dark:text-blue-300'}`}>{googleConnected ? 'Google Calendar متصل ✓' : 'ربط Google Calendar'}</button>{googleConnected && <button onClick={onSyncGoogle} disabled={syncingGoogle} className="flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 disabled:opacity-50 dark:border-violet-900 dark:text-violet-300">{syncingGoogle ? 'جارٍ المزامنة...' : 'مزامنة الآن'}</button>}<button onClick={() => showForm()} className="flex items-center gap-2 rounded-xl bg-[#174235] px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />موعد جديد</button></div></div>
    </div>
    <div className="space-y-3">{sorted.map((event) => { const start = new Date(event.start_at); return <article key={event.id} className="flex items-start gap-3 rounded-2xl border border-[#e8e4db] bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="w-16 shrink-0 rounded-xl bg-sky-50 p-2 text-center dark:bg-sky-950/40"><div className="text-xs text-sky-700 dark:text-sky-300">{start.toLocaleDateString('ar-EG', { month: 'short' })}</div><div className="text-xl font-black">{start.getDate()}</div></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{event.title}</h2>{event.recurrence.frequency !== 'none' && <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"><Repeat2 className="h-3 w-3" />{recurrenceLabels[event.recurrence.frequency]}</span>}</div><div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{event.all_day ? 'طوال اليوم' : start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>{event.reminder_minutes != null && <span>تذكير قبل {event.reminder_minutes} دقيقة</span>}</div>{event.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.description}</p>}</div><div className="flex shrink-0 gap-1"><button onClick={() => showForm(event)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="h-4 w-4" /></button><button onClick={() => onDelete(event)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"><Trash2 className="h-4 w-4" /></button></div></article>; })}{!sorted.length && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">لا توجد مواعيد بعد.</div>}</div>

    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-2xl bg-white p-5 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="font-bold">{editing ? 'تعديل الموعد' : 'موعد جديد'}</h2><button type="button" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
      <label className="block text-xs">العنوان<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label><label className="block text-xs">التفاصيل<textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label>
      <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs">التاريخ<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label><label className="text-xs">البداية<input disabled={allDay} type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800" /></label><label className="text-xs">النهاية<input disabled={allDay} type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800" /></label></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />طوال اليوم</label>
      <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs">التكرار<select value={frequency} onChange={(event) => setFrequency(event.target.value as CalendarRecurrenceFrequency)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800">{Object.entries(recurrenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs">كل<input type="number" min="1" value={interval} onChange={(event) => setInterval(Number(event.target.value))} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label><label className="text-xs">حتى<input type="date" value={until} onChange={(event) => setUntil(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label></div>
      {frequency === 'weekly' && <div className="flex flex-wrap gap-1">{dayLabels.map((label, index) => <button type="button" key={label} onClick={() => setDays((current) => current.includes(index) ? current.filter((day) => day !== index) : [...current, index])} className={`rounded-lg px-2 py-1 text-xs ${days.includes(index) ? 'bg-[#174235] text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{label}</button>)}</div>}
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">التذكير بالدقائق<input type="number" min="0" max="10080" value={reminder} onChange={(event) => setReminder(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label><label className="text-xs">الركيزة<select value={pillarId} onChange={(event) => setPillarId(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"><option value="">بدون</option>{pillars.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="text-xs">المشروع<select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"><option value="">بدون</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="text-xs">المهمة<select value={taskId} onChange={(event) => setTaskId(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"><option value="">بدون</option>{tasks.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div>
      {formError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{formError}</p>}
      <button type="submit" className="w-full rounded-xl bg-[#174235] py-3 text-sm font-bold text-white">حفظ الموعد</button></form></div>}
  </div>;
}

export default CalendarTabView;
