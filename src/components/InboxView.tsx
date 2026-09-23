import React, { useState } from 'react';
import { Inbox, CheckCircle2, ArrowRight, Trash2, Plus, Sparkles, CheckSquare, FileText } from 'lucide-react';
import { InboxItem, Project } from '../types';

interface InboxViewProps {
  inbox: InboxItem[];
  projects: Project[];
  onAddInboxItem: (text: string, type: 'idea' | 'task' | 'note') => void;
  onConvertToTask: (inboxId: string, text: string, projectId: string) => void;
  onConvertToNote: (inboxId: string, text: string) => void;
  onDeleteInboxItem: (inboxId: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  inbox,
  projects,
  onAddInboxItem,
  onConvertToTask,
  onConvertToNote,
  onDeleteInboxItem,
}) => {
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<InboxItem['type']>('task');
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || '');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddInboxItem(newText.trim(), newType as any);
    setNewText('');
  };

  const handleConvert = (item: InboxItem) => {
    if (item.type === 'task') {
      onConvertToTask(item.id, item.text, targetProjectId);
    } else {
      onConvertToNote(item.id, item.text);
    }
    setConvertingId(null);
  };

  const pendingItems = inbox.filter((i) => !i.processed);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <span>📥</span>
            <span>Inbox · صندوق الوارد السريع</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            تفريغ الذهن ومعالجة المدخلات
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            «عقلك لتوليد الأفكار لا لتخزينها». أفرغ كل ما يخطر ببالك هنا ثم حوله إلى مهام في المشاريع أو ملاحظات في المستودع.
          </p>
        </div>
      </div>

      {/* Quick Input Bar */}
      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs">
        <div className="flex-1 w-full">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="التقط فكرة، مهمة، أو رابطاً سريعاً..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white"
          />
        </div>

        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as any)}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
        >
          <option value="task">مهمة عمل</option>
          <option value="idea">فكرة ملهمة</option>
          <option value="note">ملاحظة عامة</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shrink-0 cursor-pointer"
        >
          التقاط فوراً
        </button>
      </form>

      {/* Inbox Items List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-700">
            العناصر بانتظار المعالجة ({pendingItems.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            حوّل العنصر إلى مساره الصحيح لتفريغ الصندوق
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              🎉 صندوق الوارد فارغ تماماً! ذهنك صافٍ ومنظم.
            </div>
          ) : (
            pendingItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-base mt-0.5">
                    {item.type === 'task' ? '⚡' : item.type === 'idea' ? '💡' : '📝'}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{item.text}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {convertingId === item.id ? (
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg">
                      {item.type === 'task' && (
                        <select
                          value={targetProjectId}
                          onChange={(e) => setTargetProjectId(e.target.value)}
                          className="bg-white border text-[11px] p-1 rounded"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => handleConvert(item)}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] cursor-pointer"
                      >
                        تأكيد النقل
                      </button>
                      <button
                        onClick={() => setConvertingId(null)}
                        className="px-2 py-1 text-slate-500 text-[10px] cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConvertingId(item.id)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      {item.type === 'task' ? 'نقل للمشاريع ➔' : 'نقل للمستودع ➔'}
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteInboxItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
