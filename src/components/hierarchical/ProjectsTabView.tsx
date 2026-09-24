import React, { useState } from 'react';
import { Folder, Plus, Edit2, Trash2, Calendar, ChevronLeft, Filter, CheckSquare } from 'lucide-react';
import { Project, ValueGoal, Task } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';
import { CustomSelect } from './CustomSelect';

interface ProjectsTabViewProps {
  projects: Project[];
  goals: ValueGoal[];
  tasks: Task[];
  onSelectProject: (projectId: string, goalId: string) => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectsTabView: React.FC<ProjectsTabViewProps> = ({
  projects,
  goals,
  tasks,
  onSelectProject,
  onNewProject,
  onEditProject,
  onDeleteProject,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const getParentGoal = (goalId: string) => goals.find((g) => g.id === goalId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#131d18] p-5 rounded-2xl border border-[#e8e5de] dark:border-[#26372d] shadow-2xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434] flex items-center justify-center font-bold">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#1a2420] dark:text-white">المشاريع التنفيذية (Projects)</h1>
            <p className="text-xs text-[#636e67] dark:text-[#9bb0a3]">
              المبادرات العملية القائمة، وكل مشروع يحتوي على مهام ترفع نسبة تقدمه تلقائياً.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: `كل المشاريع (${projects.length})` },
              { value: 'in_progress', label: 'قيد التنفيذ', icon: '🟡' },
              { value: 'completed', label: 'مكتمل', icon: '🟢' },
              { value: 'planned', label: 'مخطط', icon: '⚪' },
            ]}
            prefixIcon={<Filter className="w-3.5 h-3.5 text-[#7d8982] dark:text-[#8ea095]" />}
            size="xs"
            buttonClassName="rounded-xl py-1 px-2.5 bg-[#f8f7f4] dark:bg-[#192620] border-[#e3dfd7] dark:border-[#283830]"
          />

          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1 px-3.5 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مشروع جديد</span>
          </button>
        </div>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-12 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3]">
          لا توجد مشاريع مطابقة للمحددات الحالية.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const parentGoal = getParentGoal(proj.goal_id);
            const projectTasks = tasks.filter((t) => t.project_id === proj.id);
            const completedTasks = projectTasks.filter((t) => t.status === 'done').length;

            return (
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
                      {proj.status === 'completed' ? '✓ مكتمل' : proj.status === 'in_progress' ? 'قيد التنفيذ' : 'مخطط'}
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
                    {parentGoal && (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 font-medium mb-1.5 truncate max-w-full">
                        🎯 الهدف: {parentGoal.title}
                      </span>
                    )}

                    <h3
                      onClick={() => onSelectProject(proj.id, proj.goal_id)}
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

                  <div className="flex items-center justify-between text-[11px] text-[#7d8982] dark:text-[#8ea095] pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#9aa59e]" />
                      <span>{proj.start_date} ← {proj.due_date}</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[#5c6861] dark:text-[#c4d6cb]">
                      <CheckSquare className="w-3 h-3 text-[#174235] dark:text-emerald-400" />
                      <span>{completedTasks}/{projectTasks.length}</span>
                    </span>
                  </div>
                </div>

                {/* Progress rollup */}
                <div className="pt-3 border-t border-[#f0eee9] dark:border-[#223028] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#738078] dark:text-[#8ea095]">التقدم الصاعد:</span>
                    <span className="text-[11px] font-mono font-bold text-[#174235] dark:text-emerald-400">{proj.progress}%</span>
                  </div>
                  <ProgressBar progress={proj.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                  <button
                    type="button"
                    onClick={() => onSelectProject(proj.id, proj.goal_id)}
                    className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] dark:bg-[#1a2620] hover:bg-[#ebf4f0] dark:hover:bg-[#22332a] text-[#174235] dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-[#283830] group-hover:border-[#cfe3d9] dark:group-hover:border-[#335544] cursor-pointer"
                  >
                    <span>عرض مهام المشروع ({projectTasks.length})</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
