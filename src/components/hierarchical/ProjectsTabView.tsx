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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e8e5de] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9] flex items-center justify-center font-bold">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#1a2420]">المشروعات التنفيذية</h1>
            <p className="text-xs text-[#636e67]">
              المبادرات العملية القائمة، وكل مشروع يحتوي على مهام ترفع نسبة تقدمه تلقائياً فور إنجازها.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: `كل المشروعات (${projects.length})` },
              { value: 'in_progress', label: 'قيد التنفيذ', icon: '🟡' },
              { value: 'completed', label: 'مكتمل', icon: '🟢' },
              { value: 'planned', label: 'مخطط له', icon: '⚪' },
            ]}
            prefixIcon={<Filter className="w-3.5 h-3.5 text-[#7d8982]" />}
            size="xs"
            buttonClassName="rounded-xl py-1 px-2.5 bg-[#f8f7f4] border-[#e3dfd7]"
          />

          <button
            onClick={onNewProject}
            className="flex items-center gap-1 px-3.5 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مشروع جديد</span>
          </button>
        </div>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-[#e8e5de] rounded-2xl p-12 text-center text-xs text-[#7d8982]">
          لا توجد مشروعات مطابقة للمحددات الحالية.
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
                      {proj.status === 'completed' ? '✓ مكتمل' : proj.status === 'in_progress' ? 'قيد التنفيذ' : 'مخطط'}
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
                    {parentGoal && (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-[#ebf4f0] text-[#174235] font-medium mb-1.5 truncate max-w-full">
                        🎯 الهدف: {parentGoal.title}
                      </span>
                    )}

                    <h3
                      onClick={() => onSelectProject(proj.id, proj.goal_id)}
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

                  <div className="flex items-center justify-between text-[11px] text-[#7d8982] pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#9aa59e]" />
                      <span>{proj.start_date} ← {proj.due_date}</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[#5c6861]">
                      <CheckSquare className="w-3 h-3 text-[#174235]" />
                      <span>{completedTasks}/{projectTasks.length}</span>
                    </span>
                  </div>
                </div>

                {/* Progress rollup */}
                <div className="pt-3 border-t border-[#f0eee9] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#738078]">التقدم الصاعد:</span>
                    <span className="text-[11px] font-mono font-bold text-[#174235]">{proj.progress}%</span>
                  </div>
                  <ProgressBar progress={proj.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                  <button
                    onClick={() => onSelectProject(proj.id, proj.goal_id)}
                    className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] hover:bg-[#ebf4f0] text-[#174235] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] group-hover:border-[#cfe3d9] cursor-pointer"
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
