import React, { useState } from 'react';
import { Zap, CheckSquare, Sparkles, BookOpen, FileText, Plus } from 'lucide-react';
import { Project, Pillar } from '../types';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  pillars: Pillar[];
  onAddTask: (taskTitle: string, projectId: string) => void;
  onAddInboxItem: (text: string, type: 'idea' | 'task' | 'note') => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  projects,
  pillars,
  onAddTask,
  onAddInboxItem,
}) => {
  const [captureType, setCaptureType] = useState<'task' | 'idea' | 'note'>('task');
  const [inputText, setInputText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (captureType === 'task') {
      onAddTask(inputText.trim(), selectedProjectId);
    } else {
      onAddInboxItem(inputText.trim(), captureType);
    }

    setInputText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-sm">التقاط سريع</h3>
              <p className="text-[11px] text-slate-300">أفرغ ذهنك فوراً من أي فكرة أو مهمة أو خاطر</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'task' as const, label: 'مهمة عمل', icon: <CheckSquare className="w-3.5 h-3.5" /> },
              { id: 'idea' as const, label: 'فكرة ملهمة', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'note' as const, label: 'ملاحظة عامة', icon: <FileText className="w-3.5 h-3.5" /> },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setCaptureType(t.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg border font-bold transition-all cursor-pointer ${
                  captureType === t.id
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Text Input */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">المحتوى:</label>
            <textarea
              rows={3}
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={captureType === 'task' ? 'اكتب عنوان المهمة الجديدة...' : 'اكتب الفكرة أو الخاطرة...'}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              required
            />
          </div>

          {captureType === 'task' && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">المشروع التابع له:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer"
            >
              حفظ في النظام
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
