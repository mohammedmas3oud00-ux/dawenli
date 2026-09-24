import React, { useState } from 'react';
import { CheckSquare, Plus, Edit2, Trash2, Calendar, CheckCircle2, Filter, ArrowUpRight, Play } from 'lucide-react';
import { Task, Project } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';

interface TasksTabViewProps {
  tasks: Task[];
  projects: Project[];
  onToggleStatus: (taskId: string) => void;
  onNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectProject: (projectId: string) => void;
  onStartFocus?: (task: Task) => void;
}

export const TasksTabView: React.FC<TasksTabViewProps> = ({
  tasks,
  projects,
  onToggleStatus,
  onNewTask,
  onEditTask,
  onDeleteTask,
  onSelectProject,
  onStartFocus,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'todo' && t.status === 'done') return false;
    if (statusFilter === 'done' && t.status !== 'done') return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const getParentProject = (projectId: string) => projects.find((p) => p.id === projectId);

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const todoCount = tasks.length - doneCount;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header with Lean Metrics Strip */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e8e4db] shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] text-[#174235] flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-[#1a2420]">كل المهام اليومية (Tasks)</h1>
                <span className="text-xs font-mono text-[#78857e] tabular-nums">
                  ({todoCount} متبقية · {doneCount} منجزة)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74]">
                قائمة الإنجاز والعمليات اليومية المنبثقة من المشاريع وأهداف القيمة.
              </p>
            </div>
          </div>

          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مهمة جديدة</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0ede6]">
          <div className="flex items-center bg-[#f4f2ec] p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              الكل <span className="font-mono tabular-nums text-[11px]">({tasks.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('todo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                statusFilter === 'todo'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              قيد التنفيذ <span className="font-mono tabular-nums text-[11px]">({todoCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('done')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                statusFilter === 'done'
                  ? 'bg-white text-[#174235] shadow-2xs font-semibold'
                  : 'text-[#637068] hover:text-[#1a2420]'
              }`}
            >
              المنجزة <span className="font-mono tabular-nums text-[11px]">({doneCount})</span>
            </button>
          </div>

          <CustomSelect
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
            options={[
              { value: 'all', label: 'كل الأولويات' },
              { value: 'high', label: 'عالية فقط', icon: '🔴' },
              { value: 'medium', label: 'متوسطة', icon: '🟡' },
              { value: 'low', label: 'منخفضة', icon: '🟢' },
            ]}
            prefixIcon={<Filter className="w-3 h-3" />}
            size="xs"
            buttonClassName="rounded-lg py-1 px-2.5 bg-[#f8f7f4] border-[#d8d4cc]"
          />
        </div>
      </div>

      {/* Task Rows List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-[#e8e4db] rounded-2xl p-10 text-center text-xs text-[#7d8982]">
          لا توجد مهام مطابقة للشروط الحالية.
        </div>
      ) : (
        <div className="bg-white border border-[#e8e4db] rounded-2xl divide-y divide-[#f0ede6] shadow-2xs overflow-hidden">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const parentProject = getParentProject(task.project_id);

            return (
              <div
                key={task.id}
                className={`p-3.5 sm:p-4 flex items-start justify-between gap-3 transition-colors group ${
                  isDone ? 'bg-[#faf9f6]' : 'hover:bg-[#fcfbfa]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleStatus(task.id)}
                    className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-[#174235] border-[#174235] text-white shadow-2xs'
                        : 'border-[#c9c5bd] hover:border-[#174235] bg-white'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-3 h-3 stroke-2" />}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        onClick={() => onToggleStatus(task.id)}
                        className={`font-medium transition-all cursor-pointer ${
                          isDone ? 'line-through text-[#99a39c]' : 'text-[#1a2420]'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Anti-pill subtle priority label */}
                      {task.priority === 'high' && (
                        <span className="text-[11px] text-rose-700 font-medium flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                          <span>أولوية عالية</span>
                        </span>
                      )}
                      {task.priority === 'medium' && (
                        <span className="text-[11px] text-[#8f691c] font-medium flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c99732] inline-block" />
                          <span>متوسطة</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDone ? 'text-[#99a39c]' : 'text-[#636e67]'}`}>
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-[#7d8982]">
                      {parentProject && (
                        <button
                          onClick={() => onSelectProject(parentProject.id)}
                          className="flex items-center gap-1 hover:text-[#174235] font-medium transition-colors cursor-pointer"
                        >
                          <span>📁 {parentProject.title}</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {task.due_date && (
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Calendar className="w-3 h-3 text-[#9aa69f]" />
                          <span>{task.due_date}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onStartFocus && !isDone && (
                    <button
                      onClick={() => onStartFocus(task)}
                      className="p-1.5 text-[#174235] hover:bg-[#ebf4f0] rounded-lg transition-colors cursor-pointer"
                      title="بدء جلسة تركيز (بومودورو / فلوتايم) على هذه المهمة"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#174235]" />
                    </button>
                  )}
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1.5 text-[#85928a] hover:text-[#1a2420] rounded hover:bg-[#f4f2ec] cursor-pointer"
                    title="تعديل المهمة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-[#85928a] hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                    title="حذف"
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
  );
};
