import React from 'react';
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Calendar, 
  CheckSquare, 
  AlertCircle,
  AlertTriangle,
  Zap,
  Sparkles
} from 'lucide-react';
import { Task, Project, TeamMember, TaskStatus, Priority, EnergyLevel } from '../types';
import { Avatar } from './Avatar';
import { checkTaskDependencies } from '../utils/progressCalculator';

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  members: TeamMember[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onAddTaskToColumn: (status: TaskStatus) => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  colorClass: string;
  headerBg: string;
}

const COLUMNS: ColumnConfig[] = [
  { 
    id: 'todo', 
    title: 'قائمة الانتظار', 
    colorClass: 'text-slate-700',
    headerBg: 'border-slate-300' 
  },
  { 
    id: 'in_progress', 
    title: 'قيد التنفيذ', 
    colorClass: 'text-blue-700',
    headerBg: 'border-blue-500' 
  },
  { 
    id: 'in_review', 
    title: 'المراجعة وضبط الجودة', 
    colorClass: 'text-amber-700',
    headerBg: 'border-amber-500' 
  },
  { 
    id: 'completed', 
    title: 'مكتملة بنجاح', 
    colorClass: 'text-emerald-700',
    headerBg: 'border-emerald-500' 
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  projects,
  members,
  onUpdateTaskStatus,
  onToggleTaskComplete,
  onSelectTask,
  onAddTaskToColumn,
}) => {
  const getPriorityInfo = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return { label: 'عاجل جداً', color: 'text-rose-600 font-bold' };
      case 'high': return { label: 'مرتفع', color: 'text-amber-600 font-bold' };
      case 'medium': return { label: 'متوسط', color: 'text-blue-600' };
      case 'low': return { label: 'منخفض', color: 'text-slate-500' };
      default: return { label: 'عادي', color: 'text-slate-500' };
    }
  };

  const getEnergyBadge = (level?: EnergyLevel) => {
    switch (level) {
      case 'high':
        return (
          <span title="مستوى الطاقة: تركيز عميق" className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            🚀 عميق
          </span>
        );
      case 'medium':
        return (
          <span title="مستوى الطاقة: متوسطة" className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            ⚡ متوسط
          </span>
        );
      case 'low':
      default:
        return (
          <span title="مستوى الطاقة: خفيفة" className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            🔋 خفيف
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const totalColWeight = colTasks.reduce((acc, t) => acc + (t.weight || 1), 0);

        return (
          <div 
            key={col.id} 
            className="bg-slate-100/70 border border-slate-200 rounded-lg p-3 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className={`pb-3 mb-3 border-b-2 ${col.headerBg} flex items-center justify-between`}>
              <div>
                <h3 className={`text-sm font-bold ${col.colorClass}`}>
                  {col.title}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>{colTasks.length} مهام</span>
                  <span aria-hidden="true">·</span>
                  <span>{totalColWeight} نقطة جهد</span>
                </div>
              </div>

              <button
                onClick={() => onAddTaskToColumn(col.id)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-colors cursor-pointer"
                title={`إضافة مهمة إلى ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
              {colTasks.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-md bg-white/50">
                  لا توجد مهام في هذه المرحلة
                </div>
              ) : (
                colTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const assignee = members.find((m) => m.id === task.assigneeId);
                  const priority = getPriorityInfo(task.priority);
                  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                  const totalSubtasks = task.subtasks?.length || 0;
                  const now = new Date();
                  const isOverdue = task.status !== 'completed' && new Date(task.dueDate).getTime() < now.getTime();
                  const depCheck = checkTaskDependencies(task, tasks);

                  const next = getNextStatus(task.status);
                  const prev = getPrevStatus(task.status);

                  return (
                    <div
                      key={task.id}
                      className={`bg-white border rounded-md p-3.5 shadow-xs hover:border-slate-400 transition-all ${
                        task.status === 'completed'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : depCheck.isBlocked
                          ? 'border-amber-300 bg-amber-50/20'
                          : isOverdue
                          ? 'border-rose-300'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Top row: Project & Priority */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span className="truncate max-w-[140px] font-medium text-slate-700">
                          {project?.name || 'مشروع عام'}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`font-semibold ${priority.color}`}>
                            {priority.label}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-600">
                            {task.weight} ن
                          </span>
                        </div>
                      </div>

                      {/* Strategic Attributes Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {getEnergyBadge(task.energyLevel)}
                        <span 
                          title="درجة التأثير الاستراتيجي"
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 font-bold"
                        >
                          أثر: {task.impactScore || 5}/10
                        </span>
                        {depCheck.isBlocked && (
                          <span 
                            title={`معلقة بانتظار: ${depCheck.blockingTasks.map((b) => b.title).join('، ')}`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>معلقة</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Checkbox */}
                      <div className="flex items-start gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => onToggleTaskComplete(task.id)}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <h4
                          onClick={() => onSelectTask(task)}
                          className={`text-xs font-semibold leading-snug cursor-pointer hover:text-indigo-600 transition-colors ${
                            task.status === 'completed'
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Subtasks summary if any */}
                      {totalSubtasks > 0 && (
                        <div className="mb-2.5 bg-slate-50 rounded px-2 py-1 text-[11px] text-slate-600 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <CheckSquare className="w-3 h-3 text-slate-400" />
                            <span>المهام الفرعية:</span>
                          </div>
                          <span className="font-mono font-medium">
                            {completedSubtasks} / {totalSubtasks}
                          </span>
                        </div>
                      )}

                      {/* Footer: Date & Assignee & Navigation */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        
                        {/* Due date */}
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className={`w-3 h-3 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span className={isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'}>
                            {task.dueDate}
                          </span>
                        </div>

                        {/* Assignee & Move Buttons */}
                        <div className="flex items-center gap-1.5">
                          {assignee && (
                            <Avatar
                              name={assignee.name}
                              avatar={assignee.avatar}
                              size="xs"
                              title={assignee.name}
                            />
                          )}

                          {/* Quick Stage Shifters */}
                          <div className="flex items-center border border-slate-200 rounded overflow-hidden">
                            {prev && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, prev)}
                                className="p-1 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                                title="تحريك للمرحلة السابقة"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            {next && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, next)}
                                className="p-1 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                                title="تحريك للمرحلة التالية"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

function getNextStatus(current: TaskStatus): TaskStatus | null {
  switch (current) {
    case 'todo': return 'in_progress';
    case 'in_progress': return 'in_review';
    case 'in_review': return 'completed';
    case 'completed': return null;
  }
}

function getPrevStatus(current: TaskStatus): TaskStatus | null {
  switch (current) {
    case 'todo': return null;
    case 'in_progress': return 'todo';
    case 'in_review': return 'in_progress';
    case 'completed': return 'in_review';
  }
}
