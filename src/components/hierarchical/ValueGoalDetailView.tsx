import React from 'react';
import { Plus, Edit2, Trash2, Folder, Calendar, ChevronLeft, Eye } from 'lucide-react';
import { Pillar, Vision, ValueGoal, Project } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';

interface ValueGoalDetailViewProps {
  pillar: Pillar;
  vision?: Vision;
  goal: ValueGoal;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onEditGoal: (goal: ValueGoal) => void;
}

export const ValueGoalDetailView: React.FC<ValueGoalDetailViewProps> = ({
  pillar,
  vision,
  goal,
  projects,
  onSelectProject,
  onNewProject,
  onEditProject,
  onDeleteProject,
  onEditGoal,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Goal Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eee9] dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[#f4f2ec] dark:bg-slate-800 text-[#48534d] dark:text-slate-300 border border-[#e4dfd6] dark:border-slate-700">
                الركيزة: {pillar.title}
              </span>
              {vision && (
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 border border-[#cfe3d9] dark:border-emerald-800 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>الرؤية: {vision.title}</span>
                </span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                goal.status === 'completed'
                  ? 'bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 border border-[#cfe3d9] dark:border-emerald-800'
                  : goal.status === 'in_progress'
                  ? 'bg-[#fef7ea] dark:bg-amber-950/70 text-[#916b1e] dark:text-amber-300 border border-[#f3e5c8] dark:border-amber-800'
                  : 'bg-[#f3f0e8] dark:bg-slate-800 text-[#555047] dark:text-slate-400'
              }`}>
                {goal.status === 'completed' ? '✓ مكتمل' : goal.status === 'in_progress' ? 'قيد العمل' : 'لم يبدأ'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#1a2420] dark:text-slate-100">{goal.title}</h1>
            {goal.description && (
              <p className="text-xs text-[#636e67] dark:text-slate-400 max-w-2xl leading-relaxed">{goal.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onEditGoal(goal)}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#f6f5f1] dark:bg-slate-800 hover:bg-[#ede9e1] dark:hover:bg-slate-700 text-[#3f4b44] dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e1d8] dark:border-slate-700 transition-colors"
            >
              تعديل الهدف
            </button>
            <button
              onClick={onNewProject}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مشروع جديد</span>
            </button>
          </div>
        </div>

        {/* Goal Metadata & Progress Rollup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#5c6861] dark:text-slate-400">
            {goal.target_date && (
              <div className="flex items-center gap-1.5 bg-[#f8f7f4] dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-[#ece8e0] dark:border-slate-700">
                <Calendar className="w-4 h-4 text-[#7d8982] dark:text-slate-400" />
                <span>تاريخ الاستحقاق:</span>
                <span className="font-mono font-bold text-[#1a2420] dark:text-slate-200">{goal.target_date}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#f8f7f4] dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-[#ece8e0] dark:border-slate-700">
              <Folder className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
              <span>عدد المشاريع:</span>
              <span className="font-bold text-[#1a2420] dark:text-slate-200">{projects.length}</span>
            </div>
          </div>

          <div className="bg-[#f8f7f4] dark:bg-slate-800/80 p-3 rounded-xl border border-[#ece8e0] dark:border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#647169] dark:text-slate-400 font-medium">نسبة التقدم المحسوبة:</span>
              <span className="font-mono font-bold text-[#174235] dark:text-emerald-400">{goal.progress}%</span>
            </div>
            <ProgressBar progress={goal.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />
          </div>
        </div>
      </div>

      {/* Projects List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#1a2420] dark:text-slate-100 flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
              <span>المشاريع التنفيذية</span>
            </h2>
            <p className="text-[11px] text-[#6d7972] dark:text-slate-400">
              المبادرات العملية التي تحقق هذا الهدف. انقر على أي مشروع للتعمق في المهام وقوائم الإنجاز.
            </p>
          </div>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مشروع جديد</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-[#7d8982] dark:text-slate-400">
            لا توجد مشاريع مسجلة تحت هذا الهدف حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 hover:border-[#174235]/40 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      proj.status === 'completed'
                        ? 'bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 border border-[#cfe3d9] dark:border-emerald-800'
                        : proj.status === 'in_progress'
                        ? 'bg-[#fef7ea] dark:bg-amber-950/70 text-[#916b1e] dark:text-amber-300 border border-[#f3e5c8] dark:border-amber-800'
                        : 'bg-[#f3f0e8] dark:bg-slate-800 text-[#555047] dark:text-slate-400'
                    }`}>
                      {proj.status === 'completed'
                        ? '✓ مكتمل'
                        : proj.status === 'in_progress'
                        ? 'قيد التنفيذ'
                        : proj.status === 'planned'
                        ? 'مخطط'
                        : 'معلق'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditProject(proj)}
                        className="p-1 text-[#838f87] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-200 rounded cursor-pointer"
                        title="تعديل المشروع"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1 text-[#838f87] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
                        title="حذف المشروع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3
                      onClick={() => onSelectProject(proj.id)}
                      className="font-bold text-sm text-[#1a2420] dark:text-slate-100 group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {proj.title}
                    </h3>
                    {proj.description && (
                      <p className="text-xs text-[#636e67] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#7d8982] dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{proj.start_date} ← {proj.due_date}</span>
                    </span>
                  </div>
                </div>

                {/* Progress & Drill-down */}
                <div className="pt-3 border-t border-[#f0eee9] dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#738078] dark:text-slate-400">التقدم (من المهام):</span>
                    <span className="text-[11px] font-mono font-bold text-[#174235] dark:text-emerald-400">{proj.progress}%</span>
                  </div>
                  <ProgressBar progress={proj.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                  <button
                    onClick={() => onSelectProject(proj.id)}
                    className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] dark:bg-slate-800 hover:bg-[#ebf4f0] dark:hover:bg-slate-700 text-[#174235] dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-slate-700 group-hover:border-[#cfe3d9] dark:group-hover:border-emerald-800 cursor-pointer"
                  >
                    <span>الدخول وتصفح المهام</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
