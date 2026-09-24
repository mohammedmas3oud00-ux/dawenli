import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Calendar, CheckSquare, Sparkles, RefreshCw } from 'lucide-react';
import { Pillar, ValueGoal, Project, Task } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';
import { decomposeProjectWithAi } from '../../utils/speechRecognition';

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
  onBatchAddTasks?: (tasks: Partial<Task>[]) => void;
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
  onBatchAddTasks,
}) => {
  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const [isDecomposing, setIsDecomposing] = useState(false);

  const handleAiDecompose = async () => {
    if (!onBatchAddTasks) return;
    setIsDecomposing(true);
    try {
      const generated = await decomposeProjectWithAi(project.title, project.description, pillar.title);
      if (generated && generated.length > 0) {
        const newTasks: Partial<Task>[] = generated.map((g) => ({
          project_id: project.id,
          title: g.title,
          description: g.description || '',
          priority: (g.priority as any) || 'medium',
          status: 'todo',
          estimated_hours: g.estimatedHours || 1,
          energy_level: (g.energyLevel as any) || 'medium',
          completed_at: null,
        }));
        onBatchAddTasks(newTasks);
      }
    } catch (err) {
      console.error('Failed to decompose project with AI:', err);
    } finally {
      setIsDecomposing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Project Header Card */}
      <div className="bg-white border border-[#e8e5de] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eee9] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md font-bold bg-[#f4f2ec] text-[#48534d] border border-[#e4dfd6]">
                الركيزة: {pillar.title}
              </span>
              <span className="text-[#9aa59e]">/</span>
              <span className="px-2 py-0.5 rounded-md font-bold bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9]">
                الهدف: {goal.title}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                project.status === 'completed'
                  ? 'bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9]'
                  : project.status === 'in_progress'
                  ? 'bg-[#fef7ea] text-[#916b1e] border border-[#f3e5c8]'
                  : 'bg-[#f3f0e8] text-[#555047]'
              }`}>
                {project.status === 'completed' ? '✓ مكتمل' : project.status === 'in_progress' ? 'قيد التنفيذ' : 'مخطط له'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#1a2420]">{project.title}</h1>
            {project.description && (
              <p className="text-xs text-[#636e67] max-w-2xl leading-relaxed">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBatchAddTasks && (
              <button
                type="button"
                onClick={handleAiDecompose}
                disabled={isDecomposing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
                title="تفكيك المشروع لمهام تنفيذية بالذكاء الاصطناعي"
              >
                {isDecomposing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التفكيك...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>تفكيك ذكي (AI)</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => onEditProject(project)}
              className="px-3 py-1.5 bg-[#f6f5f1] hover:bg-[#ede9e1] text-[#3f4b44] rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e1d8]"
            >
              تعديل المشروع
            </button>
            <button
              onClick={onNewTask}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مهمة جديدة</span>
            </button>
          </div>
        </div>

        {/* Project Metadata & Auto-Calculated Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-3 text-[#5c6861]">
            <div className="flex items-center gap-1.5 bg-[#f8f7f4] px-3 py-2 rounded-xl border border-[#ece8e0]">
              <Calendar className="w-4 h-4 text-[#7d8982]" />
              <span>المدى الزمني:</span>
              <span className="font-mono font-bold text-[#1a2420]">{project.start_date} ← {project.due_date}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f8f7f4] px-3 py-2 rounded-xl border border-[#ece8e0]">
              <CheckSquare className="w-4 h-4 text-[#174235]" />
              <span>المهام المنجزة:</span>
              <span className="font-bold text-[#1a2420]">{completedCount} من {tasks.length}</span>
            </div>
          </div>

          <div className="bg-[#f8f7f4] p-3 rounded-xl border border-[#ece8e0] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#647169] font-medium">التقدم المحسوب تصاعدياً (من المهام):</span>
              <span className="font-mono font-bold text-[#174235]">{project.progress}%</span>
            </div>
            <ProgressBar progress={project.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />
          </div>
        </div>
      </div>

      {/* Tasks List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1a2420] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#174235]" />
              <span>المهام التنفيذية (Actionable Tasks)</span>
            </h2>
            <p className="text-[11px] text-[#6d7972]">
              انقر على مربع الاختيار لتسجيل الإنجاز وتحديث نسب المشروع والهدف والرؤية والركيزة فوراً.
            </p>
          </div>

          <button
            onClick={onNewTask}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مهمة جديدة</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white border border-[#e8e5de] rounded-2xl p-8 text-center text-xs text-[#7d8982]">
            لا توجد مهام مسجلة تحت هذا المشروع حتى الآن.
          </div>
        ) : (
          <div className="bg-white border border-[#e8e5de] rounded-2xl divide-y divide-[#f0eee9] shadow-2xs overflow-hidden">
            {tasks.map((task) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    isDone ? 'bg-[#faf9f6]' : 'hover:bg-[#fbfbfa]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => onToggleTaskStatus(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-[#174235] border-[#174235] text-white shadow-2xs'
                          : 'border-[#c9c5bd] hover:border-[#174235] bg-white'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          onClick={() => onToggleTaskStatus(task.id)}
                          className={`text-xs font-bold transition-all cursor-pointer ${
                            isDone ? 'line-through text-[#99a39c]' : 'text-[#1a2420]'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-[#fdedec] text-[#b9382e] border border-[#f5c6cb]'
                              : task.priority === 'medium'
                              ? 'bg-[#fef7ea] text-[#916b1e] border border-[#f3e5c8]'
                              : 'bg-[#f3f0e8] text-[#555047]'
                          }`}
                        >
                          {task.priority === 'high' ? 'أولوية عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                        </span>
                      </div>

                      {task.description && (
                        <p className={`text-[11px] leading-relaxed ${isDone ? 'text-[#99a39c]' : 'text-[#636e67]'}`}>
                          {task.description}
                        </p>
                      )}

                      {task.due_date && (
                        <div className="flex items-center gap-1 text-[10px] text-[#7d8982] font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>الاستحقاق: {task.due_date}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1 text-[#838f87] hover:text-[#1a2420] rounded cursor-pointer"
                      title="تعديل المهمة"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 text-[#838f87] hover:text-rose-600 rounded cursor-pointer"
                      title="حذف المهمة"
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
