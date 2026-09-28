import { useEffect, useMemo, useState } from 'react';
import { BookHeart, Headphones, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { JournalEntry, JournalMood, Pillar, Project } from '../../../types/hierarchical';
import { supabase } from '../../../shared/services/supabaseClient';
import { toLocalDateKey } from '../../../utils/date';

interface Props {
  entries: JournalEntry[];
  pillars: Pillar[];
  projects: Project[];
  onSave(entry: Partial<JournalEntry>): void;
  onDelete(entry: JournalEntry): void;
}

const moodLabels: Record<JournalMood, string> = { great: 'رائع', good: 'جيد', neutral: 'عادي', difficult: 'صعب' };

export function JournalTabView({ entries, pillars, projects, onSave, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(toLocalDateKey());
  const [mood, setMood] = useState<JournalMood | ''>('');
  const [tags, setTags] = useState('');
  const [pillarId, setPillarId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    void Promise.all(entries.filter((entry) => entry.audio_path).map(async (entry) => {
      const { data } = await supabase!.storage.from('journal-audio').createSignedUrl(entry.audio_path!, 900);
      return [entry.id, data?.signedUrl || ''] as const;
    })).then((pairs) => { if (active) setAudioUrls(Object.fromEntries(pairs.filter(([, value]) => value))); });
    return () => { active = false; };
  }, [entries]);

  const filtered = useMemo(() => entries
    .filter((entry) => `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => `${b.entry_date}${b.created_at}`.localeCompare(`${a.entry_date}${a.created_at}`)), [entries, query]);

  const showForm = (entry?: JournalEntry) => {
    setEditing(entry || null);
    setTitle(entry?.title || 'يومياتي');
    setContent(entry?.content || '');
    setDate(entry?.entry_date || toLocalDateKey());
    setMood(entry?.mood || '');
    setTags(entry?.tags.join('، ') || '');
    setPillarId(entry?.pillar_id || '');
    setProjectId(entry?.project_id || '');
    setOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    onSave({
      ...(editing ? { id: editing.id, created_at: editing.created_at, audio_path: editing.audio_path } : {}),
      title: title.trim() || 'يومياتي', content: content.trim(), entry_date: date, mood: mood || null,
      tags: tags.split(/[،,]/).map((tag) => tag.trim()).filter(Boolean), pillar_id: pillarId || null, project_id: projectId || null,
    });
    setOpen(false);
  };

  return <div className="mx-auto max-w-5xl space-y-4">
    <div className="rounded-2xl border border-[#e8e4db] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-rose-50 p-2 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"><BookHeart className="h-5 w-5" /></div><div><h1 className="font-bold">اليوميات</h1><p className="text-xs text-slate-500">اكتب كما أنت؛ يمكن للمساعد تحويل الكلام إلى يومية بعد موافقتك.</p></div></div>
        <button onClick={() => showForm()} className="flex items-center justify-center gap-2 rounded-xl bg-[#174235] px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />يومية جديدة</button>
      </div>
      <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-slate-700"><Search className="h-4 w-4 text-slate-400" /><input aria-label="ابحث في اليوميات" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في اليوميات" className="w-full bg-transparent py-2.5 text-sm outline-none" /></label>
    </div>

    <div className="space-y-3">
      {filtered.map((entry) => <article key={entry.id} className="rounded-2xl border border-[#e8e4db] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{entry.title}</h2><span className="text-xs text-slate-500">{entry.entry_date}</span>{entry.mood && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">{moodLabels[entry.mood]}</span>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{entry.content}</p></div><div className="flex shrink-0 gap-1"><button onClick={() => showForm(entry)} aria-label="تعديل اليومية" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="h-4 w-4" /></button><button onClick={() => onDelete(entry)} aria-label="حذف اليومية" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"><Trash2 className="h-4 w-4" /></button></div></div>
        {!!entry.tags.length && <div className="mt-3 flex flex-wrap gap-1">{entry.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] dark:bg-slate-800">#{tag}</span>)}</div>}
        {audioUrls[entry.id] && <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-800"><Headphones className="h-4 w-4" /><audio aria-label={`التسجيل الصوتي ليومية ${entry.title}`} controls preload="none" src={audioUrls[entry.id]} className="h-8 w-full"><track kind="captions" srcLang="ar" label="نص اليومية" src={`data:text/vtt;charset=utf-8,${encodeURIComponent(`WEBVTT\n\n00:00.000 --> 99:59.999\n${entry.content}`)}`} /></audio></div>}
      </article>)}
      {!filtered.length && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">لا توجد يوميات مطابقة.</div>}
    </div>

    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl space-y-3 overflow-y-auto rounded-2xl bg-white p-5 dark:bg-slate-900">
      <div className="flex items-center justify-between"><h2 className="font-bold">{editing ? 'تعديل اليومية' : 'يومية جديدة'}</h2><button type="button" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">العنوان<input aria-label="عنوان اليومية" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label><label className="text-xs">التاريخ<input aria-label="تاريخ اليومية" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label></div>
      <label className="block text-xs">النص<textarea aria-label="نص اليومية" required rows={9} value={content} onChange={(event) => setContent(event.target.value)} className="mt-1 w-full rounded-xl border p-3 leading-7 dark:border-slate-700 dark:bg-slate-800" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">الحالة الشعورية<select value={mood} onChange={(event) => setMood(event.target.value as JournalMood | '')} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"><option value="">بدون</option>{Object.entries(moodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs">الوسوم<input aria-label="وسوم اليومية" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="تفكير، تعلم" className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800" /></label></div>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs">الركيزة<select value={pillarId} onChange={(event) => setPillarId(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"><option value="">بدون ربط</option>{pillars.map((pillar) => <option key={pillar.id} value={pillar.id}>{pillar.title}</option>)}</select></label><label className="text-xs">المشروع<select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1 w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"><option value="">بدون ربط</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label></div>
      <button className="w-full rounded-xl bg-[#174235] py-3 text-sm font-bold text-white">حفظ اليومية</button>
    </form></div>}
  </div>;
}

export default JournalTabView;
