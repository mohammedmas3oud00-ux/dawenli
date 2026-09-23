import React, { useState } from 'react';
import { 
  Milestone as MilestoneIcon, 
  CheckCircle2, 
  Calendar, 
  Plus, 
  Flag,
  Check,
  Clock
} from 'lucide-react';
import { Milestone, Project } from '../types';

interface MilestoneTimelineProps {
  milestones: Milestone[];
  projects: Project[];
  onToggleMilestone: (id: string) => void;
  onAddMilestone: (milestone: Omit<Milestone, 'id'>) => void;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  milestones,
  projects,
  onToggleMilestone,
  onAddMilestone,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newProjId, setNewProjId] = useState(projects[0]?.id || '');

  const filteredMilestones = milestones
    .filter((m) => selectedProjectId === 'all' || m.projectId === selectedProjectId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    onAddMilestone({
      projectId: newProjId,
      title: newTitle.trim(),
      dueDate: newDueDate,
      completed: false,
      order: milestones.length + 1,
    });

    setNewTitle('');
    setNewDueDate('');
    setShowAddModal(false);
  };

  const completedCount = filteredMilestones.filter((m) => m.completed).length;
  const milestoneProgress = filteredMilestones.length > 0
    ? Math.round((completedCount / filteredMilestones.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Header & Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Flag className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-900">
                المعالم والمحطات الرئيسية (Milestones)
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              تتبع الأهداف الكبرى ومواعيد التسليم الحاسمة لكل مشروع.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800 font-semibold cursor-pointer"
            >
              <option value="all">جميع المشاريع</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مَعلَم</span>
            </button>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600">نسبة اكتمال المعالم الرئيسية:</span>
              <span className="font-mono font-bold text-slate-900">
                {completedCount} / {filteredMilestones.length} ({milestoneProgress}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            لا توجد معالم رئيسية مسجلة بعد لهذا المشروع.
          </div>
        ) : (
          <div className="relative border-r-2 border-slate-200 pr-6 space-y-8 mr-4">
            {filteredMilestones.map((m) => {
              const project = projects.find((p) => p.id === m.projectId);
              const now = new Date();
              const isOverdue = !m.completed && new Date(m.dueDate).getTime() < now.getTime();

              return (
                <div key={m.id} className="relative group">
                  {/* Timeline Dot */}
                  <button
                    onClick={() => onToggleMilestone(m.id)}
                    className={`absolute -right-[33px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      m.completed
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : isOverdue
                        ? 'bg-rose-500 text-white ring-4 ring-rose-100'
                        : 'bg-white border-2 border-slate-300 hover:border-indigo-600'
                    }`}
                    title={m.completed ? 'تعليم كغير مكتمل' : 'تعليم كمكتمل'}
                  >
                    {m.completed ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    )}
                  </button>

                  {/* Milestone Card */}
                  <div className={`p-4 rounded-md border text-xs transition-all ${
                    m.completed
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isOverdue
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-indigo-600">
                        {project?.name || 'مشروع عام'}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {m.dueDate}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-500 font-bold mr-1">
                            (تجاوز الموعد)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <h4 className={`text-sm font-bold ${
                        m.completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}>
                        {m.title}
                      </h4>
                      <button
                        onClick={() => onToggleMilestone(m.id)}
                        className={`px-2 py-1 rounded text-[11px] font-medium shrink-0 cursor-pointer ${
                          m.completed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        {m.completed ? 'مكتمل' : 'قيد الانتظار'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              إضافة مَعلَم رئيسي جديد
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  المشروع التابع له:
                </label>
                <select
                  value={newProjId}
                  onChange={(e) => setNewProjId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  عنوان المعلم / الهدف:
                </label>
                <input
                  type="text"
                  placeholder="مثال: إطلاق الإصدار التجريبي للعملاء"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  تاريخ التسليم المستهدف:
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md cursor-pointer"
                >
                  حفظ المعلم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
