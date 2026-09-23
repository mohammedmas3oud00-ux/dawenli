import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Filter,
  CheckSquare, 
  Plus, 
  Zap, 
  AlertTriangle 
} from 'lucide-react';
import { Task, Project, TeamMember, TaskStatus, Priority, EnergyLevel } from '../types';
import { Avatar } from './Avatar';
import { checkTaskDependencies } from '../utils/progressCalculator';

interface TaskListViewProps {
  tasks: Task[];
  projects: Project[];
  members: TeamMember[];
  onToggleTaskComplete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onNewTask: () => void;
}

type SortField = 'dueDate' | 'priority' | 'weight' | 'impact' | 'title' | 'status';

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  projects,
  members,
  onToggleTaskComplete,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onNewTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterEnergy, setFilterEnergy] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const priorityWeight: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const statusWeight: Record<TaskStatus, number> = {
    todo: 1,
    in_progress: 2,
    in_review: 3,
    completed: 4,
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterEnergy !== 'all' && t.energyLevel !== filterEnergy) return false;
    if (filterAssignee !== 'all' && t.assigneeId !== filterAssignee) return false;
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comp = 0;
    if (sortField === 'dueDate') {
      comp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortField === 'priority') {
      comp = priorityWeight[a.priority] - priorityWeight[b.priority];
    } else if (sortField === 'weight') {
      comp = a.weight - b.weight;
    } else if (sortField === 'impact') {
      comp = (a.impactScore || 5) - (b.impactScore || 5);
    } else if (sortField === 'status') {
      comp = statusWeight[a.status] - statusWeight[b.status];
    } else {
      comp = a.title.localeCompare(b.title, 'ar');
    }
    return sortAsc ? comp : -comp;
  });

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return { text: 'مكتملة', color: 'text-emerald-700 bg-emerald-50' };
      case 'in_review': return { text: 'قيد المراجعة', color: 'text-amber-700 bg-amber-50' };
      case 'in_progress': return { text: 'قيد التنفيذ', color: 'text-blue-700 bg-blue-50' };
      case 'todo': return { text: 'قائمة الانتظار', color: 'text-slate-700 bg-slate-100' };
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return { text: 'عاجلة', color: 'text-rose-600' };
      case 'high': return { text: 'مرتفعة', color: 'text-amber-600' };
      case 'medium': return { text: 'متوسطة', color: 'text-slate-600' };
      case 'low': return { text: 'منخفضة', color: 'text-slate-400' };
    }
  };

  const getEnergyBadge = (level?: EnergyLevel) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>🚀</span>
            <span>عميق</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span>⚡</span>
            <span>متوسط</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>🔋</span>
            <span>خفيف</span>
          </span>
        );
    }
  };

  const now = new Date();

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      
      {/* Control bar / Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/50">
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="todo">قائمة الانتظار</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="in_review">قيد المراجعة</option>
            <option value="completed">مكتملة</option>
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">كل الأولويات</option>
            <option value="urgent">عاجلة</option>
            <option value="high">مرتفعة</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>

          {/* Energy filter */}
          <select
            value={filterEnergy}
            onChange={(e) => setFilterEnergy(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">كل مستويات الطاقة</option>
            <option value="low">🔋 طاقة خفيفة</option>
            <option value="medium">⚡ طاقة متوسطة</option>
            <option value="high">🚀 تركيز عميق</option>
          </select>

          {/* Assignee filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">جميع المسؤولين</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">
            عدد المهام المعروضة: {sortedTasks.length}
          </span>
          <button
            onClick={onNewTask}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مهمة</span>
          </button>
        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th 
                onClick={() => handleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>المهمة والمشروع</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('status')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>الحالة</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('priority')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>الأولوية</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('impact')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>الأثر الاستراتيجي</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">مستوى الطاقة</th>
              <th 
                onClick={() => handleSort('weight')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>وزن المهمة</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">المهام الفرعية</th>
              <th className="py-3 px-3">المسؤول</th>
              <th 
                onClick={() => handleSort('dueDate')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>الموعد النهائي</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  لا توجد مهام مطابقة للشروط المحددة
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const assignee = members.find((m) => m.id === task.assigneeId);
                const status = getStatusLabel(task.status);
                const priority = getPriorityLabel(task.priority);
                const isOverdue = task.status !== 'completed' && new Date(task.dueDate).getTime() < now.getTime();
                const totalSubtasks = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                const depCheck = checkTaskDependencies(task, tasks);

                return (
                  <tr 
                    key={task.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => onToggleTaskComplete(task.id)}
                        className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Task Title & Project */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => onSelectTask(task)}
                          className={`font-semibold cursor-pointer hover:text-indigo-600 transition-colors ${
                            task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>
                        {depCheck.isBlocked && (
                          <span 
                            title={`معلقة بانتظار: ${depCheck.blockingTasks.map((b) => b.title).join('، ')}`}
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold shrink-0"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>معلقة</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-slate-500">{project?.name || 'مشروع غير محدد'}</span>
                        {task.tags?.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{task.tags.join('، ')}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`font-semibold ${priority.color}`}>
                        {priority.text}
                      </span>
                    </td>

                    {/* Strategic Impact & Value */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono">
                      <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">
                        {task.impactScore || 5}/10
                      </span>
                    </td>

                    {/* Energy Level */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getEnergyBadge(task.energyLevel)}
                    </td>

                    {/* Weight */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono">
                      <span className="text-slate-900 font-bold">{task.weight}</span>
                      <span className="text-slate-400 text-[11px] mr-1">نقاط</span>
                    </td>

                    {/* Subtasks */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                      {totalSubtasks > 0 ? (
                        <span>
                          {completedSubtasks} / {totalSubtasks}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            name={assignee.name}
                            avatar={assignee.avatar}
                            size="xs"
                          />
                          <span className="text-slate-700 font-medium truncate max-w-[90px]">
                            {assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">غير محدد</span>
                      )}
                    </td>

                    {/* Due date */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`font-mono ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        {task.dueDate}
                      </span>
                      {isOverdue && (
                        <span className="block text-[10px] text-rose-500">متأخر</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="تعديل المهمة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="حذف المهمة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
