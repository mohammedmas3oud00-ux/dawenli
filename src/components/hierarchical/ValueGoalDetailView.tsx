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
      <div className="bg-white border border-[#e8e5de] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eee9] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[#f4f2ec] text-[#48534d] border border-[#e4dfd6]">
                الركيزة: {pillar.title}
              </span>
              {vision && (
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9] flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>الرؤية: {vision.title}</span>
                </span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                goal.status === 'completed'
                  ? 'bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9]'
                  : goal.status === 'in_progress'
                  ? 'bg-[#fef7ea] text-[#916b1e] border border-[#f3e5c8]'
                  : 'bg-[#f3f0e8] text-[#555047]'
              }`}>
                {goal.status === 'completed' ? '✓ مكتمل' : goal.status === 'in_progress' ? 'قيد العمل' : 'لم يبدأ'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#1a2420]">{goal.title}</h1>
            {goal.description && (
              <p className="text-xs text-[#636e67] max-w-2xl leading-relaxed">{goal.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEditGoal(goal)}
              className="px-3 py-1.5 bg-[#f6f5f1] hover:bg-[#ede9e1] text-[#3f4b44] rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e1d8]"
            >
              تعديل الهدف
            </button>
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مشروع جديد</span>
            </button>
          </div>
        </div>

        {/* Goal Metadata & Progress Rollup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex items-center gap-4 text-[#5c6861]">
            {goal.target_date && (
              <div className="flex items-center gap-1.5 bg-[#f8f7f4] px-3 py-2 rounded-xl border border-[#ece8e0]">
                <Calendar className="w-4 h-4 text-[#7d8982]" />
                <span>تاريخ الاستحقاق:</span>
                <span className="font-mono font-bold text-[#1a2420]">{goal.target_date}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#f8f7f4] px-3 py-2 rounded-xl border border-[#ece8e0]">
              <Folder className="w-4 h-4 text-[#174235]" />
              <span>عدد المشاريع:</span>
              <span className="font-bold text-[#1a2420]">{projects.length}</span>
            </div>
          </div>

          <div className="bg-[#f8f7f4] p-3 rounded-xl border border-[#ece8e0] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#647169] font-medium">نسبة التقدم المحسوبة:</span>
              <span className="font-mono font-bold text-[#174235]">{goal.progress}%</span>
            </div>
            <ProgressBar progress={goal.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />
          </div>
        </div>
      </div>

      {/* Projects List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1a2420] flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#174235]" />
              <span>المشاريع التنفيذية</span>
            </h2>
            <p className="text-[11px] text-[#6d7972]">
              المبادرات العملية التي تحقق هذا الهدف. انقر على أي مشروع للتعمق في المهام وقوائم الإنجاز.
            </p>
          </div>

          <button
            onClick={onNewProject}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مشروع جديد</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-[#e8e5de] rounded-2xl p-8 text-center text-xs text-[#7d8982]">
            لا توجد مشاريع مسجلة تحت هذا الهدف حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white border border-[#e8e5de] hover:border-[#174235]/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      proj.status === 'completed'
                        ? 'bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9]'
                        : proj.status === 'in_progress'
                        ? 'bg-[#fef7ea] text-[#916b1e] border border-[#f3e5c8]'
                        : 'bg-[#f3f0e8] text-[#555047]'
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
                        className="p-1 text-[#838f87] hover:text-[#1a2420] rounded cursor-pointer"
                        title="تعديل المشروع"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1 text-[#838f87] hover:text-rose-600 rounded cursor-pointer"
                        title="حذف المشروع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3
                      onClick={() => onSelectProject(proj.id)}
                      className="font-bold text-sm text-[#1a2420] group-hover:text-[#174235] transition-colors cursor-pointer"
                    >
                      {proj.title}
                    </h3>
                    {proj.description && (
                      <p className="text-xs text-[#636e67] mt-1 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#7d8982] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{proj.start_date} ← {proj.due_date}</span>
                    </span>
                  </div>
                </div>

                {/* Progress & Drill-down */}
                <div className="pt-3 border-t border-[#f0eee9] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#738078]">التقدم (من المهام):</span>
                    <span className="text-[11px] font-mono font-bold text-[#174235]">{proj.progress}%</span>
                  </div>
                  <ProgressBar progress={proj.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                  <button
                    onClick={() => onSelectProject(proj.id)}
                    className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] hover:bg-[#ebf4f0] text-[#174235] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] group-hover:border-[#cfe3d9] cursor-pointer"
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
