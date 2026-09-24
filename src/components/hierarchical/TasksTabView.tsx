import React, { useState } from 'react';
import { toLocalDateKey } from '../../utils/date';
import { 
  CheckSquare, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Filter, 
  ArrowUpRight, 
  Play, 
  LayoutList, 
  Kanban, 
  ChevronRight, 
  ChevronLeft,
  Sliders,
  ArrowRight,
  Circle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Task, Project, CustomFieldDefinition } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';
import { CustomFieldsManagerModal } from './CustomFieldsManagerModal';

interface TasksTabViewProps {
  tasks: Task[];
  projects: Project[];
  onToggleStatus: (taskId: string) => void;
  onUpdateStatus?: (taskId: string, status: Task['status']) => void;
  onUpdateCustomFields?: (taskId: string, customFields: Record<string, any>) => void;
  onNewTask: (defaultDate?: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectProject: (projectId: string) => void;
  onStartFocus?: (task: Task) => void;
  customFields: CustomFieldDefinition[];
  onCustomFieldsChange: (fields: CustomFieldDefinition[]) => void;
}

type ViewMode = 'list' | 'board' | 'calendar';

export const TasksTabView: React.FC<TasksTabViewProps> = ({
  tasks,
  projects,
  onToggleStatus,
  onUpdateStatus,
  onUpdateCustomFields,
  onNewTask,
  onEditTask,
  onDeleteTask,
  onSelectProject,
  onStartFocus,
  customFields,
  onCustomFieldsChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Notion-like Custom Fields State
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());


  const handleCustomFieldChange = (taskId: string, fieldId: string, value: any) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const existing = task.custom_fields || {};
    const updated = { ...existing, [fieldId]: value };
    if (onUpdateCustomFields) {
      onUpdateCustomFields(taskId, updated);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'todo' && t.status === 'done') return false;
    if (statusFilter === 'done' && t.status !== 'done') return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
    return true;
  });

  const getParentProject = (projectId: string) => projects.find((p) => p.id === projectId);

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const todoCount = tasks.filter((t) => t.status !== 'done').length;

  // Calendar calculations
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Arabic Month names
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const handleTodayMonth = () => {
    setCurrentCalendarDate(new Date());
  };

  const handleStatusChangeInternal = (taskId: string, targetStatus: Task['status']) => {
    if (onUpdateStatus) {
      onUpdateStatus(taskId, targetStatus);
    } else {
      onToggleStatus(taskId);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header & Controls Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-[#e8e4db] dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] dark:bg-emerald-950/80 text-[#174235] dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-[#1a2420] dark:text-slate-100">كل المهام اليومية</h1>
                <span className="text-xs font-mono text-[#78857e] dark:text-slate-400 tabular-nums">
                  ({todoCount} متبقية · {doneCount} منجزة)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74] dark:text-slate-400">
                مرونة Notion المتقدمة: طرق عرض متعددة مع خصائص وحقول مخصصة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
            {/* Custom Fields Button */}
            <button
              onClick={() => setIsFieldsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f8f7f4] dark:bg-slate-800 hover:bg-[#edeae2] dark:hover:bg-slate-700 text-[#36423b] dark:text-slate-200 border border-[#e0dbd1] dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="إدارة الحقول والخصائص المخصصة (شبيهة بـ Notion)"
            >
              <Sliders className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
              <span>الخصائص المخصصة</span>
              {customFields.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#174235] dark:bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                  {customFields.length}
                </span>
              )}
            </button>

            {/* New Task Button */}
            <button
              onClick={() => onNewTask()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مهمة جديدة</span>
            </button>
          </div>
        </div>

        {/* View Switcher & Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0ede6] dark:border-slate-800">
          
          {/* Notion View Switcher */}
          <div className="flex items-center bg-[#f4f2ec] dark:bg-slate-800 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-[#637068] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>عرض القائمة</span>
            </button>

            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-[#637068] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>لوحة كانبان</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-[#637068] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>التقويم</span>
            </button>
          </div>

          {/* Filtering options */}
          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === 'list' && (
              <div className="flex items-center bg-[#f4f2ec] dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                      : 'text-[#637068] dark:text-slate-400'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setStatusFilter('todo')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'todo'
                      ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                      : 'text-[#637068] dark:text-slate-400'
                  }`}
                >
                  قيد التنفيذ
                </button>
                <button
                  onClick={() => setStatusFilter('done')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'done'
                      ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                      : 'text-[#637068] dark:text-slate-400'
                  }`}
                >
                  المنجزة
                </button>
              </div>
            )}

            <CustomSelect
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val)}
              options={[
                { value: 'all', label: 'كل الأولويات' },
                { value: 'high', label: 'عالية فقط', icon: '🔴' },
                { value: 'medium', label: 'متوسطة', icon: '🟡' },
                { value: 'low', label: 'منخفضة', icon: '🟢' },
              ]}
              prefixIcon={<Filter className="w-3 h-3 text-[#7d8982] dark:text-slate-400" />}
              size="xs"
              buttonClassName="rounded-lg py-1 px-2.5 bg-[#f8f7f4] dark:bg-slate-800 border-[#d8d4cc] dark:border-slate-700"
            />

            {projects.length > 0 && (
              <CustomSelect
                value={projectFilter}
                onChange={(val) => setProjectFilter(val)}
                options={[
                  { value: 'all', label: 'كل المشروعات' },
                  ...projects.map((p) => ({ value: p.id, label: p.title })),
                ]}
                size="xs"
                buttonClassName="rounded-lg py-1 px-2.5 bg-[#f8f7f4] dark:bg-slate-800 border-[#d8d4cc] dark:border-slate-700 max-w-[150px] truncate"
              />
            )}
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. VIEW MODE: LIST VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'list' && (
        filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-[#e8e4db] dark:border-slate-800 rounded-2xl p-10 text-center text-xs text-[#7d8982] dark:text-slate-400">
            لا توجد مهام مطابقة للشروط الحالية.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-[#e8e4db] dark:border-slate-800 rounded-2xl divide-y divide-[#f0ede6] dark:divide-slate-800 shadow-2xs overflow-hidden">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'done';
              const parentProject = getParentProject(task.project_id);

              return (
                <div
                  key={task.id}
                  className={`p-3.5 sm:p-4 flex items-start justify-between gap-3 transition-colors group ${
                    isDone ? 'bg-[#faf9f6] dark:bg-slate-900/40' : 'hover:bg-[#fcfbfa] dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleStatus(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-[#174235] dark:bg-emerald-600 border-[#174235] dark:border-emerald-600 text-white shadow-2xs'
                          : 'border-[#c9c5bd] dark:border-slate-600 hover:border-[#174235] dark:hover:border-emerald-400 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-2" />}
                    </button>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          onClick={() => onToggleStatus(task.id)}
                          className={`font-medium transition-all cursor-pointer ${
                            isDone ? 'line-through text-[#99a39c] dark:text-slate-500' : 'text-[#1a2420] dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority tag */}
                        {task.priority === 'high' && (
                          <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                            <span>أولوية عالية</span>
                          </span>
                        )}
                        {task.priority === 'medium' && (
                          <span className="text-[11px] text-[#8f691c] dark:text-amber-400 font-medium flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c99732] inline-block" />
                            <span>متوسطة</span>
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDone ? 'text-[#99a39c] dark:text-slate-500' : 'text-[#636e67] dark:text-slate-400'}`}>
                          {task.description}
                        </p>
                      )}

                      {/* Custom Fields Badges in List Row */}
                      {customFields.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {customFields.map((f) => {
                            const val = task.custom_fields?.[f.id];
                            if (f.type === 'checkbox') {
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => handleCustomFieldChange(task.id, f.id, !val)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer border ${
                                    val
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-[#f4f2ec] dark:bg-slate-800 border-[#e0dbd1] dark:border-slate-700 text-[#738078] dark:text-slate-400'
                                  }`}
                                >
                                  <span>{f.name}:</span>
                                  <span>{val ? '✓ نعم' : '✗ لا'}</span>
                                </button>
                              );
                            }
                            if (val !== undefined && val !== null && val !== '') {
                              return (
                                <span
                                  key={f.id}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#f0eee9] dark:bg-slate-800 border border-[#ded9cf] dark:border-slate-700 text-[#3d4b43] dark:text-slate-300 flex items-center gap-1"
                                >
                                  <span className="text-[#808d85] dark:text-slate-400">{f.name}:</span>
                                  <span className="font-bold">{String(val)}</span>
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-[#7d8982] dark:text-slate-400">
                        {parentProject && (
                          <button
                            onClick={() => onSelectProject(parentProject.id)}
                            className="flex items-center gap-1 hover:text-[#174235] dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                          >
                            <span>📁 {parentProject.title}</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        )}

                        {task.due_date && (
                          <span className="flex items-center gap-1 font-mono tabular-nums">
                            <CalendarIcon className="w-3 h-3 text-[#9aa69f] dark:text-slate-500" />
                            <span>{task.due_date}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {onStartFocus && !isDone && (
                      <button
                        onClick={() => onStartFocus(task)}
                        className="p-1.5 text-[#174235] dark:text-emerald-400 hover:bg-[#ebf4f0] dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="بدء جلسة تركيز على هذه المهمة"
                      >
                        <Play className="w-3.5 h-3.5 fill-[#174235] dark:fill-emerald-400" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1.5 text-[#85928a] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-100 rounded hover:bg-[#f4f2ec] dark:hover:bg-slate-800 cursor-pointer"
                      title="تعديل المهمة"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-[#85928a] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. VIEW MODE: KANBAN BOARD */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: TODO */}
          {(() => {
            const colTasks = filteredTasks.filter((t) => t.status === 'todo');
            return (
              <div className="bg-[#f7f5f1] dark:bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-[#e8e4db] dark:border-slate-800 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2ddd3] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 text-slate-500 fill-slate-300" />
                    <span className="font-bold text-xs text-[#2a352f] dark:text-slate-200">للبدء والتنفيذ</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-[#ded8cc] dark:border-slate-700 text-[#55635b] dark:text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] no-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-[#8e9c94] dark:text-slate-500 border border-dashed border-[#ddd8cd] dark:border-slate-800 rounded-xl">
                      لا توجد مهام في قائمة البدء
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        parentProject={getParentProject(task.project_id)}
                        customFields={customFields}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onStartFocus={onStartFocus}
                        onMoveStatus={(nextStatus) => handleStatusChangeInternal(task.id, nextStatus)}
                        onCustomFieldChange={(fieldId, val) => handleCustomFieldChange(task.id, fieldId, val)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })()}

          {/* Column 2: IN PROGRESS */}
          {(() => {
            const colTasks = filteredTasks.filter((t) => t.status === 'in_progress');
            return (
              <div className="bg-[#fdfaf3] dark:bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-[#e8e0d0] dark:border-slate-800 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e4dccb] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-xs text-[#2a352f] dark:text-slate-200">قيد العمل المباشر</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-[#ded8cc] dark:border-slate-700 text-[#55635b] dark:text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] no-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-[#8e9c94] dark:text-slate-500 border border-dashed border-[#e4dccb] dark:border-slate-800 rounded-xl">
                      لا توجد مهام جارية حالياً
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        parentProject={getParentProject(task.project_id)}
                        customFields={customFields}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onStartFocus={onStartFocus}
                        onMoveStatus={(nextStatus) => handleStatusChangeInternal(task.id, nextStatus)}
                        onCustomFieldChange={(fieldId, val) => handleCustomFieldChange(task.id, fieldId, val)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })()}

          {/* Column 3: DONE */}
          {(() => {
            const colTasks = filteredTasks.filter((t) => t.status === 'done');
            return (
              <div className="bg-[#f3f8f5] dark:bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-[#d6e7df] dark:border-slate-800 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#cde0d7] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-[#2a352f] dark:text-slate-200">المهام المنجزة</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-[#c4dbd0] dark:border-slate-700 text-[#174235] dark:text-emerald-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] no-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-[#8e9c94] dark:text-slate-500 border border-dashed border-[#cde0d7] dark:border-slate-800 rounded-xl">
                      لا توجد مهام منجزة بعد
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        parentProject={getParentProject(task.project_id)}
                        customFields={customFields}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onStartFocus={onStartFocus}
                        onMoveStatus={(nextStatus) => handleStatusChangeInternal(task.id, nextStatus)}
                        onCustomFieldChange={(fieldId, val) => handleCustomFieldChange(task.id, fieldId, val)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. VIEW MODE: CALENDAR VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 border border-[#e8e4db] dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1a2420] dark:text-slate-100">
                {arabicMonths[month]} {year}
              </h2>
              <button
                onClick={handleTodayMonth}
                className="px-2.5 py-1 rounded-lg bg-[#f4f2ec] dark:bg-slate-800 hover:bg-[#eae6dd] dark:hover:bg-slate-700 text-xs font-semibold text-[#404e46] dark:text-slate-300 transition-colors cursor-pointer"
              >
                اليوم
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-[#e0dbd1] dark:border-slate-700 hover:bg-[#f6f5f0] dark:hover:bg-slate-800 text-[#404e46] dark:text-slate-300 transition-colors cursor-pointer"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-[#e0dbd1] dark:border-slate-700 hover:bg-[#f6f5f0] dark:hover:bg-slate-800 text-[#404e46] dark:text-slate-300 transition-colors cursor-pointer"
                title="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#6a7870] dark:text-slate-400 py-2 border-b border-[#f0eee9] dark:border-slate-800">
            <div>الأحد</div>
            <div>الإثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div>الجمعة</div>
            <div>السبت</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] rounded-xl bg-[#faf9f6]/40 dark:bg-slate-900/20" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayTasks = tasks.filter((t) => t.due_date === dateString);
              const isToday = toLocalDateKey() === dateString;

              return (
                <div
                  key={dateString}
                  className={`min-h-[90px] p-1.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isToday
                      ? 'border-[#174235] dark:border-emerald-500 bg-[#f4f9f6] dark:bg-emerald-950/20'
                      : 'border-[#eae6de] dark:border-slate-800 bg-[#fdfcfb] dark:bg-slate-850 hover:border-[#174235]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold rounded-md px-1.5 py-0.5 ${
                        isToday
                          ? 'bg-[#174235] text-white'
                          : 'text-[#45524b] dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    <button
                      onClick={() => onNewTask(dateString)}
                      className="text-[#96a49c] dark:text-slate-500 hover:text-[#174235] dark:hover:text-emerald-400 p-0.5 rounded cursor-pointer"
                      title="إضافة مهمة في هذا اليوم"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar max-h-24">
                    {dayTasks.map((t) => {
                      const isTaskDone = t.status === 'done';
                      return (
                        <div
                          key={t.id}
                          onClick={() => onEditTask(t)}
                          className={`p-1 rounded-md text-[10px] leading-tight cursor-pointer truncate border transition-all ${
                            isTaskDone
                              ? 'line-through text-[#909e95] dark:text-slate-500 bg-[#f4f2ee] dark:bg-slate-800/50 border-[#dfdbd2] dark:border-slate-700'
                              : t.priority === 'high'
                              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 font-medium'
                              : 'bg-white dark:bg-slate-800 border-[#dcd8ce] dark:border-slate-700 text-[#25312b] dark:text-slate-200'
                          }`}
                          title={t.title}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notion Custom Fields Manager Modal */}
      <CustomFieldsManagerModal
        isOpen={isFieldsModalOpen}
        onClose={() => setIsFieldsModalOpen(false)}
        entityType="task"
        fields={customFields}
        onFieldsChanged={onCustomFieldsChange}
      />
    </div>
  );
};

// -------------------------------------------------------------
// HELPER COMPONENT: KANBAN TASK CARD
// -------------------------------------------------------------
interface KanbanCardProps {
  task: Task;
  parentProject?: Project;
  customFields: CustomFieldDefinition[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStartFocus?: (task: Task) => void;
  onMoveStatus: (nextStatus: Task['status']) => void;
  onCustomFieldChange: (fieldId: string, val: any) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  parentProject,
  customFields,
  onEditTask,
  onDeleteTask,
  onStartFocus,
  onMoveStatus,
  onCustomFieldChange,
}) => {
  const isDone = task.status === 'done';

  return (
    <div className="p-3 bg-white dark:bg-slate-800 border border-[#e5e1d7] dark:border-slate-700 rounded-xl shadow-2xs hover:shadow-xs transition-all space-y-2 group">
      <div className="flex items-start justify-between gap-2">
        <h4
          onClick={() => onEditTask(task)}
          className={`text-xs font-semibold leading-snug cursor-pointer transition-colors ${
            isDone
              ? 'line-through text-[#909e96] dark:text-slate-500'
              : 'text-[#1a2420] dark:text-slate-100 hover:text-[#174235] dark:hover:text-emerald-400'
          }`}
        >
          {task.title}
        </h4>

        {/* Priority Dot */}
        {task.priority === 'high' && (
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1" title="أولوية عالية" />
        )}
        {task.priority === 'medium' && (
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" title="أولوية متوسطة" />
        )}
      </div>

      {task.description && (
        <p className="text-[11px] text-[#6d7b73] dark:text-slate-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Custom Fields in Kanban Card */}
      {customFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          {customFields.map((f) => {
            const val = task.custom_fields?.[f.id];
            if (f.type === 'checkbox') {
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onCustomFieldChange(f.id, !val)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors cursor-pointer ${
                    val
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                      : 'bg-[#f4f2ec] dark:bg-slate-850 border-[#d8d3c7] text-[#738078] dark:text-slate-400'
                  }`}
                >
                  {f.name}: {val ? '✓' : '✗'}
                </button>
              );
            }
            if (val !== undefined && val !== null && val !== '') {
              return (
                <span
                  key={f.id}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#f0ede6] dark:bg-slate-700/80 text-[#3d4b43] dark:text-slate-300 truncate max-w-[130px]"
                >
                  {f.name}: {String(val)}
                </span>
              );
            }
            return null;
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-[10px] text-[#78857e] dark:text-slate-400 border-t border-[#f2efe9] dark:border-slate-700/60">
        <div className="flex items-center gap-2 truncate">
          {parentProject && (
            <span className="truncate max-w-[100px] text-[#174235] dark:text-emerald-400 font-medium">
              📁 {parentProject.title}
            </span>
          )}
          {task.due_date && (
            <span className="font-mono tabular-nums">{task.due_date}</span>
          )}
        </div>

        {/* 1-Click Status Movers & Actions */}
        <div className="flex items-center gap-1">
          {task.status !== 'todo' && (
            <button
              onClick={() => onMoveStatus('todo')}
              className="px-1.5 py-0.5 rounded bg-[#f4f2ec] dark:bg-slate-700 hover:bg-[#e8e4db] text-[#334038] dark:text-slate-200 text-[10px] font-medium transition-colors cursor-pointer"
              title="نقل إلى: للبدء"
            >
              للبدء
            </button>
          )}

          {task.status !== 'in_progress' && (
            <button
              onClick={() => onMoveStatus('in_progress')}
              className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-900 dark:text-amber-300 text-[10px] font-medium transition-colors cursor-pointer"
              title="نقل إلى: قيد العمل"
            >
              قيد العمل
            </button>
          )}

          {task.status !== 'done' && (
            <button
              onClick={() => onMoveStatus('done')}
              className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 text-emerald-900 dark:text-emerald-300 text-[10px] font-medium transition-colors cursor-pointer"
              title="نقل إلى: منجزة"
            >
              منجزة ✓
            </button>
          )}

          <button
            onClick={() => onDeleteTask(task.id)}
            className="p-1 text-[#85928a] hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
            title="حذف"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
