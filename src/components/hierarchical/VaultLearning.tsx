import { useState } from 'react';
import type { VaultItem } from '../../types/hierarchical';
import { toLocalDateKey } from '../../utils/date';

export function VaultLearning({ item, onSave }: { item: VaultItem; onSave: (item: Partial<VaultItem>) => void }) {
  const [total, setTotal] = useState(item.learning?.total || 1);
  const [daily, setDaily] = useState(item.learning?.daily_target || 1);
  const [units, setUnits] = useState(1);
  const [note, setNote] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const learning = item.learning;
  const isBook = item.vault_type === 'books';
  if (!isBook && item.vault_type !== 'resources' && !learning) return null;
  const field = 'w-24 rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800';
  const save = (next: NonNullable<VaultItem['learning']>) => onSave({ id: item.id, learning: next, status: next.completed >= next.total ? 'completed' : 'reading', updated_at: new Date().toISOString() });
  return <section aria-label="متابعة التعلم" className="my-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
    <h3 className="font-bold">{isBook ? 'خطة قراءة الكتاب' : 'متابعة الكورس'}</h3>
    <div className="flex flex-wrap gap-3 text-sm">
      <label>إجمالي {isBook ? 'الصفحات' : 'الدروس'} <input aria-label="إجمالي وحدات التعلم" type="number" min="1" value={total} onChange={(e) => setTotal(Number(e.target.value))} className={field} /></label>
      <label>الهدف اليومي <input aria-label="هدف التعلم اليومي" type="number" min="1" value={daily} onChange={(e) => setDaily(Number(e.target.value))} className={field} /></label>
      <button type="button" disabled={!Number.isInteger(total) || total < (learning?.completed || 1) || !Number.isInteger(daily) || daily < 1} onClick={() => save({ kind: isBook ? 'book' : 'course', total, completed: learning?.completed || 0, daily_target: daily, sessions: learning?.sessions || [], lessons: learning?.lessons || [] })} className="rounded-xl bg-emerald-700 px-4 py-2 text-white disabled:opacity-40">{learning ? 'تحديث الخطة' : 'بدء المتابعة'}</button>
    </div>
    {learning && <>
      <p className="font-bold">{learning.completed} / {learning.total} {isBook ? 'صفحة' : 'درس'} · {Math.round(learning.completed / learning.total * 100)}%</p>
      <progress aria-label="تقدم التعلم" max={learning.total} value={learning.completed} className="h-3 w-full accent-emerald-700" />
      <p className="text-sm">إنجاز اليوم: {learning.sessions.filter((s) => s.date === toLocalDateKey()).reduce((sum, s) => sum + s.units, 0)} / {learning.daily_target}</p>
      <div className="flex flex-wrap gap-2"><input aria-label="الكمية المنجزة" type="number" min="1" value={units} onChange={(e) => setUnits(Number(e.target.value))} className={field} /><input aria-label="ملاحظات جلسة التعلم" placeholder="ما الذي تعلمته؟" value={note} onChange={(e) => setNote(e.target.value)} className="min-w-0 flex-1 rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800" /><button type="button" disabled={!Number.isInteger(units) || units < 1 || learning.completed + units > learning.total} onClick={() => { save({ ...learning, completed: learning.completed + units, sessions: [...learning.sessions, { id: crypto.randomUUID(), date: toLocalDateKey(), units, note }] }); setNote(''); }} className="rounded-xl bg-emerald-700 px-3 py-2 text-white disabled:opacity-40">تسجيل إنجاز</button></div>
      {!isBook && <div className="space-y-2"><div className="flex flex-wrap gap-2"><input aria-label="عنوان درس الكورس" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="عنوان الدرس" className="min-w-0 flex-1 rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800" /><button type="button" disabled={!lessonTitle.trim()} onClick={() => { save({ ...learning, lessons: [...learning.lessons, { id: crypto.randomUUID(), title: lessonTitle.trim(), completed: false }] }); setLessonTitle(''); }}>إضافة درس للخطة</button></div>{learning.lessons.map((lesson) => <label key={lesson.id} className="flex items-center gap-2 rounded-lg border p-2 dark:border-slate-700"><input type="checkbox" checked={lesson.completed} disabled={!lesson.completed && learning.completed >= learning.total} onChange={(e) => { const done = e.target.checked; save({ ...learning, completed: learning.completed + (done ? 1 : -1), lessons: learning.lessons.map((l) => l.id === lesson.id ? { ...l, completed: done } : l), sessions: done ? [...learning.sessions, { id: lesson.id, date: toLocalDateKey(), units: 1, note: lesson.title }] : learning.sessions.filter((s) => s.id !== lesson.id) }); }} />{lesson.title}</label>)}</div>}
      <details><summary className="cursor-pointer font-bold">سجل جلسات التعلم ({learning.sessions.length})</summary><ul className="mt-2 space-y-2">{[...learning.sessions].reverse().map((session) => <li key={session.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-2 text-sm dark:border-slate-700"><span>{session.date} · {session.units} · {session.note}</span><button type="button" onClick={() => save({ ...learning, completed: Math.max(0, learning.completed - session.units), sessions: learning.sessions.filter((s) => s.id !== session.id), lessons: learning.lessons.map((l) => l.id === session.id ? { ...l, completed: false } : l) })}>تراجع عن التسجيل</button></li>)}</ul></details>
      <p className="text-xs text-slate-500">تحديثاتك تتبع حالة المزامنة العامة للحساب.</p>
    </>}
  </section>;
}
