import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Scale, 
  Edit3, 
  Trash2, 
  CheckSquare, 
  Plus, 
  User, 
  Layers,
  Zap,
  Target,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { Task, Project, TeamMember, TaskStatus, StrategicGoal, Vision, Pillar, EnergyLevel } from '../types';
import { Avatar } from './Avatar';
import { checkTaskDependencies, calculateSmartPriorityScore } from '../utils/progressCalculator';

interface TaskDetailModalProps {
  task: Task | null;
  project?: Project;
  assignee?: TeamMember;
  goal?: StrategicGoal;
  vision?: Vision;
  pillar?: Pillar;
  allTasks?: Task[];
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateLoggedHours: (taskId: string, hours: number) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  project,
  assignee,
  goal,
  vision,
  pillar,
  allTasks = [],
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onToggleSubtask,
  onUpdateLoggedHours,
}) => {
  if (!task) return null;

  const now = new Date();
  const isOverdue = task.status !== 'completed' && new Date(task.dueDate).getTime() < now.getTime();
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const depCheck = checkTaskDependencies(task, allTasks);
  const priorityScore = calculateSmartPriorityScore(task, project, goal, allTasks);

  const getEnergyBadge = (level?: EnergyLevel) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>🚀</span>
            <span>تركيز عميق</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span>⚡</span>
            <span>طاقة متوسطة</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>🔋</span>
            <span>طاقة خفيفة</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full shadow-xl border border-slate-200 my-8">
        
        {/* Header bar */}
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            {/* Strategic Cascade Lineage */}
            {(pillar || vision || goal || project) && (
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500 mb-1.5 font-medium">
                {pillar && <span className="text-indigo-600 font-bold">{pillar.title}</span>}
                {vision && (
                  <>
                    <span>/</span>
                    <span>{vision.title.slice(0, 24)}...</span>
                  </>
                )}
                {goal && (
                  <>
                    <span>/</span>
                    <span className="text-blue-600">{goal.title.slice(0, 24)}...</span>
                  </>
                )}
                {project && (
                  <>
                    <span>/</span>
                    <span className="text-emerald-700 font-bold">{project.name}</span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-mono">وزن المهمة: {task.weight} نقاط</span>
              <span aria-hidden="true">·</span>
              <span className={
                task.priority === 'urgent' ? 'text-rose-600 font-bold' :
                task.priority === 'high' ? 'text-amber-600 font-bold' : 'text-slate-600'
              }>
                {task.priority === 'urgent' ? 'أولوية عاجلة' :
                 task.priority === 'high' ? 'أولوية مرتفعة' :
                 task.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {task.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strategic Impact & Energy Grid */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">التأثير الاستراتيجي:</span>
            <span className="font-mono font-bold text-indigo-700 text-sm">{task.impactScore || 5} / 10</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">القيمة الناتجة:</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">{task.valueScore || 5} / 10</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">الطاقة المطلوبة:</span>
            <div className="mt-0.5">{getEnergyBadge(task.energyLevel)}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">الأولوية الذكية:</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{priorityScore} / 100</span>
          </div>
        </div>

        {/* Dependency Alert if blocked */}
        {depCheck.isBlocked && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs flex items-start gap-2 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">مهمة معلقة باعتماديات غير مكتملة:</span>
              <span>لا يمكن إتمام هذه المهمة حتى تكتمل المهام التالية أولاً: </span>
              <ul className="list-disc list-inside mt-1 font-medium text-rose-900">
                {depCheck.blockingTasks.map((b) => (
                  <li key={b.id}>{b.title} ({b.status === 'in_progress' ? 'قيد التنفيذ' : 'في الانتظار'})</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Status quick changer bar */}
        <div className="mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-600 font-medium">المرحلة الحالية:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateStatus(task.id, 'todo')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                task.status === 'todo'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              قائمة الانتظار
            </button>
            <button
              onClick={() => onUpdateStatus(task.id, 'in_progress')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                task.status === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              قيد التنفيذ
            </button>
            <button
              onClick={() => onUpdateStatus(task.id, 'in_review')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                task.status === 'in_review'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              قيد المراجعة
            </button>
            <button
              onClick={() => onUpdateStatus(task.id, 'completed')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                task.status === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              مكتملة
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-1">تفاصيل المهمة:</h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-200 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {/* Subtasks interactive checklist */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              <span>قائمة المهام الفرعية (انقر للتعليم المباشر):</span>
            </div>
            {totalSubtasks > 0 && (
              <span className="font-mono text-slate-500">
                {completedSubtasks} من {totalSubtasks} ({subtaskPercentage}%)
              </span>
            )}
          </div>

          {totalSubtasks === 0 ? (
            <div className="text-xs text-slate-400 py-3 px-3 bg-slate-50 rounded border border-slate-200 text-center">
              لا توجد مهام فرعية مسجلة لهذه المهمة.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => onToggleSubtask(task.id, sub.id)}
                  className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                    sub.completed
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 text-indigo-600 rounded pointer-events-none"
                  />
                  <span className={sub.completed ? 'line-through text-slate-400' : 'text-slate-800'}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meta Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          
          {/* Assignee */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block mb-1">المسؤول عن التنفيذ:</span>
            {assignee ? (
              <div className="flex items-center gap-2">
                <Avatar
                  name={assignee.name}
                  avatar={assignee.avatar}
                  size="md"
                />
                <div>
                  <span className="font-bold text-slate-900 block">{assignee.name}</span>
                  <span className="text-[11px] text-slate-500">{assignee.role}</span>
                </div>
              </div>
            ) : (
              <span className="text-slate-400">غير محدد</span>
            )}
          </div>

          {/* Dates & Hours */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block mb-1">الجدول وساعات العمل:</span>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">الموعد النهائي:</span>
                <span className={`font-mono font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                  {task.dueDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">الساعات المنقضية:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateLoggedHours(task.id, Math.max(0, task.loggedHours - 1))}
                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded font-mono font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-slate-900 px-1">
                    {task.loggedHours} / {task.estimatedHours} س
                  </span>
                  <button
                    onClick={() => onUpdateLoggedHours(task.id, task.loggedHours + 1)}
                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded font-mono font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
            <span className="font-medium">الوسوم:</span>
            {task.tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-[11px]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
          <button
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف المهمة</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>
            <button
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded font-medium cursor-pointer transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
