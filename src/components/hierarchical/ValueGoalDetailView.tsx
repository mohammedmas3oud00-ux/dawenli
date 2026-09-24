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
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-6 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eee9] dark:border-[#223028] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[#f4f2ec] dark:bg-[#1a2620] text-[#48534d] dark:text-[#c4d6cb] border border-[#e4dfd6] dark:border-[#283830]">
                المجال: {pillar.title}
              </span>
              {vision && (
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434] flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>الرؤية: {vision.title}</span>
                </span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                goal.status === 'completed'
                  ? 'bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434]'
                  : goal.status === 'in_progress'
                  ? 'bg-[#fef7ea] dark:bg-[#272113] text-[#916b1e] dark:text-amber-400 border border-[#f3e5c8] dark:border-[#3d321d]'
                  : 'bg-[#f3f0e8] dark:bg-[#1f2823] text-[#555047] dark:text-[#9bb0a3]'
              }`}>
                {goal.status === 'completed' ? '✓ مكتمل' : goal.status === 'in_progress' ? 'قيد العمل' : 'لم يبدأ'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#1a2420] dark:text-white">{goal.title}</h1>
            {goal.description && (
              <p className="text-xs text-[#636e67] dark:text-[#9bb0a3] max-w-2xl leading-relaxed">{goal.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEditGoal(goal)}
              className="px-3 py-1.5 bg-[#f6f5f1] dark:bg-[#1a2620] hover:bg-[#ede9e1] dark:hover:bg-[#22332a] text-[#3f4b44] dark:text-[#c4d6cb] rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e1d8] dark:border-[#283830] transition-colors"
            >
              تعديل الهدف
            </button>
            <button
              type="button"
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مشروع جديد</span>
            </button>
          </div>
        </div>

        {/* Goal Metadata & Progress Rollup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex items-center gap-4 text-[#5c6861] dark:text-[#9bb0a3]">
            {goal.target_date && (
              <div className="flex items-center gap-1.5 bg-[#f8f7f4] dark:bg-[#192620] px-3 py-2 rounded-xl border border-[#ece8e0] dark:border-[#26372d]">
                <Calendar className="w-4 h-4 text-[#7d8982] dark:text-[#8ea095]" />
                <span>تاريخ الاستحقاق:</span>
                <span className="font-mono font-bold text-[#1a2420] dark:text-white">{goal.target_date}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#f8f7f4] dark:bg-[#192620] px-3 py-2 rounded-xl border border-[#ece8e0] dark:border-[#26372d]">
              <Folder className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
              <span>عدد المشاريع:</span>
              <span className="font-bold text-[#1a2420] dark:text-white">{projects.length}</span>
            </div>
          </div>

          <div className="bg-[#f8f7f4] dark:bg-[#192620] p-3 rounded-xl border border-[#ece8e0] dark:border-[#26372d] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#647169] dark:text-[#9bb0a3] font-medium">نسبة التقدم المحسوبة:</span>
              <span className="font-mono font-bold text-[#174235] dark:text-emerald-400">{goal.progress}%</span>
            </div>
            <ProgressBar progress={goal.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />
          </div>
        </div>
      </div>

      {/* Projects List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1a2420] dark:text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
              <span>المشاريع التنفيذية (Projects)</span>
            </h2>
            <p className="text-[11px] text-[#6d7972] dark:text-[#9bb0a3]">
              المبادرات العملية التي تحقق هذا الهدف. انقر على أي مشروع للتعمق في المهام.
            </p>
          </div>

          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مشروع جديد</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-8 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3]">
            لا توجد مشاريع مسجلة تحت هذا الهدف حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] hover:border-[#174235]/40 dark:hover:border-emerald-500/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      proj.status === 'completed'
                        ? 'bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434]'
                        : proj.status === 'in_progress'
                        ? 'bg-[#fef7ea] dark:bg-[#272113] text-[#916b1e] dark:text-amber-400 border border-[#f3e5c8] dark:border-[#3d321d]'
                        : 'bg-[#f3f0e8] dark:bg-[#1f2823] text-[#555047] dark:text-[#9bb0a3]'
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
                        type="button"
                        onClick={() => onEditProject(proj)}
                        className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white rounded cursor-pointer"
                        title="تعديل المشروع"
                        aria-label="تعديل المشروع"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
                        title="حذف المشروع"
                        aria-label="حذف المشروع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3
                      onClick={() => onSelectProject(proj.id)}
                      className="font-bold text-sm text-[#1a2420] dark:text-white group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {proj.title}
                    </h3>
                    {proj.description && (
                      <p className="text-xs text-[#636e67] dark:text-[#9bb0a3] mt-1 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#7d8982] dark:text-[#8ea095] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{proj.start_date} ← {proj.due_date}</span>
                    </span>
                  </div>
                </div>

                {/* Progress & Drill-down */}
                <div className="pt-3 border-t border-[#f0eee9] dark:border-[#223028] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#738078] dark:text-[#8ea095]">التقدم (من المهام):</span>
                    <span className="text-[11px] font-mono font-bold text-[#174235] dark:text-emerald-400">{proj.progress}%</span>
                  </div>
                  <ProgressBar progress={proj.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                  <button
                    type="button"
                    onClick={() => onSelectProject(proj.id)}
                    className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] dark:bg-[#1a2620] hover:bg-[#ebf4f0] dark:hover:bg-[#22332a] text-[#174235] dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-[#283830] group-hover:border-[#cfe3d9] dark:group-hover:border-[#335544] cursor-pointer"
                  >
                    <span>الدخول وتصفح المهام (Tasks)</span>
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
