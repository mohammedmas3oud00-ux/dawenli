import React from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Calendar, CheckSquare } from 'lucide-react';
import { Pillar, ValueGoal, Project, Task } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';

interface ProjectDetailViewProps {
  pillar: Pillar;
  goal: ValueGoal;
  project: Project;
  tasks: Task[];
  onToggleTaskStatus: (taskId: string) => void;
  onNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditProject: (project: Project) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  pillar,
  goal,
  project,
  tasks,
  onToggleTaskStatus,
  onNewTask,
  onEditTask,
  onDeleteTask,
  onEditProject,
}) => {
  const completedCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-6">
      
      {/* Project Header Card */}
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-6 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eee9] dark:border-[#223028] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-bold bg-[#f4f2ec] dark:bg-[#1a2620] text-[#48534d] dark:text-[#c4d6cb] border border-[#e4dfd6] dark:border-[#283830]">
                المجال: {pillar.title}
              </span>
              <span className="text-[#9aa59e] dark:text-[#56685e]">/</span>
              <span className="px-2 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434]">
                الهدف: {goal.title}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                project.status === 'completed'
                  ? 'bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434]'
                  : project.status === 'in_progress'
                  ? 'bg-[#fef7ea] dark:bg-[#272113] text-[#916b1e] dark:text-amber-400 border border-[#f3e5c8] dark:border-[#3d321d]'
                  : 'bg-[#f3f0e8] dark:bg-[#1f2823] text-[#555047] dark:text-[#9bb0a3]'
              }`}>
                {project.status === 'completed' ? '✓ مكتمل' : project.status === 'in_progress' ? 'قيد التنفيذ' : 'مخطط'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#1a2420] dark:text-white">{project.title}</h1>
            {project.description && (
              <p className="text-xs text-[#636e67] dark:text-[#9bb0a3] max-w-2xl leading-relaxed">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="px-3 py-1.5 bg-[#f6f5f1] dark:bg-[#1a2620] hover:bg-[#ede9e1] dark:hover:bg-[#22332a] text-[#3f4b44] dark:text-[#c4d6cb] rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e1d8] dark:border-[#283830] transition-colors"
            >
              تعديل المشروع
            </button>
            <button
              type="button"
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مهمة</span>
            </button>
          </div>
        </div>

        {/* Project Metadata & Auto-Calculated Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-3 text-[#5c6861] dark:text-[#9bb0a3]">
            <div className="flex items-center gap-1.5 bg-[#f8f7f4] dark:bg-[#192620] px-3 py-2 rounded-xl border border-[#ece8e0] dark:border-[#26372d]">
              <Calendar className="w-4 h-4 text-[#7d8982] dark:text-[#8ea095]" />
              <span>المدى الزمني:</span>
              <span className="font-mono font-bold text-[#1a2420] dark:text-white">{project.start_date} ← {project.due_date}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f8f7f4] dark:bg-[#192620] px-3 py-2 rounded-xl border border-[#ece8e0] dark:border-[#26372d]">
              <CheckSquare className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
              <span>المهام المنجزة:</span>
              <span className="font-bold text-[#1a2420] dark:text-white">{completedCount} من {tasks.length}</span>
            </div>
          </div>

          <div className="bg-[#f8f7f4] dark:bg-[#192620] p-3 rounded-xl border border-[#ece8e0] dark:border-[#26372d] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#647169] dark:text-[#9bb0a3] font-medium">التقدم المحسوب تصاعدياً (من المهام):</span>
              <span className="font-mono font-bold text-[#174235] dark:text-emerald-400">{project.progress}%</span>
            </div>
            <ProgressBar progress={project.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />
          </div>
        </div>
      </div>

      {/* Tasks List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1a2420] dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
              <span>المهام التنفيذية (Tasks)</span>
            </h2>
            <p className="text-[11px] text-[#6d7972] dark:text-[#9bb0a3]">
              انقر على مربع الاختيار لتسجيل الإنجاز وتحديث نسب المشروع والهدف والرؤية والركيزة فوراً.
            </p>
          </div>

          <button
            type="button"
            onClick={onNewTask}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مهمة جديدة</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-8 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3]">
            لا توجد مهام مسجلة تحت هذا المشروع حتى الآن.
          </div>
        ) : (
          <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl divide-y divide-[#f0eee9] dark:divide-[#223028] shadow-2xs overflow-hidden">
            {tasks.map((task) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    isDone ? 'bg-[#faf9f6] dark:bg-[#16211a]' : 'hover:bg-[#fbfbfa] dark:hover:bg-[#18261e]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTaskStatus(task.id)}
                      aria-label={isDone ? `إلغاء إنجاز ${task.title}` : `إنجاز ${task.title}`}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-[#174235] dark:bg-emerald-600 border-[#174235] dark:border-emerald-600 text-white shadow-2xs'
                          : 'border-[#c9c5bd] dark:border-[#3a4d40] hover:border-[#174235] dark:hover:border-emerald-500 bg-white dark:bg-[#192620]'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          onClick={() => onToggleTaskStatus(task.id)}
                          className={`text-xs font-bold transition-all cursor-pointer ${
                            isDone ? 'line-through text-[#99a39c] dark:text-[#6a7c71]' : 'text-[#1a2420] dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                              : task.priority === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                              : 'bg-[#f3f0e8] dark:bg-[#1f2823] text-[#555047] dark:text-[#9bb0a3]'
                          }`}
                        >
                          {task.priority === 'high' ? 'أولوية عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                        </span>
                      </div>

                      {task.description && (
                        <p className={`text-[11px] leading-relaxed ${isDone ? 'text-[#99a39c] dark:text-[#6a7c71]' : 'text-[#636e67] dark:text-[#9bb0a3]'}`}>
                          {task.description}
                        </p>
                      )}

                      {task.due_date && (
                        <div className="flex items-center gap-1 text-[10px] text-[#7d8982] dark:text-[#8ea095] font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>الاستحقاق: {task.due_date}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white rounded cursor-pointer"
                      title="تعديل المهمة"
                      aria-label="تعديل المهمة"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
                      title="حذف المهمة"
                      aria-label="حذف المهمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
