import React, { useState } from 'react';
import { 
  Folder, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  Filter, 
  CheckSquare, 
  LayoutGrid, 
  LayoutList, 
  Kanban, 
  Sliders, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass,
  ArrowRight
} from 'lucide-react';
import { Project, ValueGoal, Task, CustomFieldDefinition } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';
import { CustomSelect } from './CustomSelect';
import { CustomFieldsManagerModal } from './CustomFieldsManagerModal';

interface ProjectsTabViewProps {
  projects: Project[];
  goals: ValueGoal[];
  tasks: Task[];
  onSelectProject: (projectId: string, goalId: string) => void;
  onNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateStatus?: (projectId: string, status: Project['status']) => void;
  onUpdateCustomFields?: (projectId: string, customFields: Record<string, any>) => void;
  customFields: CustomFieldDefinition[];
  onCustomFieldsChange: (fields: CustomFieldDefinition[]) => void;
}

type ProjectViewMode = 'grid' | 'list' | 'board';

export const ProjectsTabView: React.FC<ProjectsTabViewProps> = ({
  projects,
  goals,
  tasks,
  onSelectProject,
  onNewProject,
  onEditProject,
  onDeleteProject,
  onUpdateStatus,
  onUpdateCustomFields,
  customFields,
  onCustomFieldsChange,
}) => {
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');

  // Custom Fields
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);

  const handleCustomFieldChange = (projectId: string, fieldId: string, value: any) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const existing = proj.custom_fields || {};
    const updated = { ...existing, [fieldId]: value };
    if (onUpdateCustomFields) {
      onUpdateCustomFields(projectId, updated);
    }
  };

  const handleStatusChangeInternal = (projectId: string, newStatus: Project['status']) => {
    if (onUpdateStatus) {
      onUpdateStatus(projectId, newStatus);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (goalFilter !== 'all' && p.goal_id !== goalFilter) return false;
    return true;
  });

  const getParentGoal = (goalId: string) => goals.find((g) => g.id === goalId);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-[#e8e5de] dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] dark:bg-emerald-950/80 text-[#174235] dark:text-emerald-300 border border-[#cfe3d9] dark:border-emerald-800 flex items-center justify-center font-bold shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#1a2420] dark:text-slate-100">المشروعات التنفيذية</h1>
              <p className="text-xs text-[#636e67] dark:text-slate-400">
                مرونة Notion المتقدمة: عرض شبكي، وقائمة تفصيلية، ولوحة كانبان مع خصائص مخصصة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Custom Properties Manager */}
            <button
              onClick={() => setIsFieldsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f8f7f4] dark:bg-slate-800 hover:bg-[#edeae2] dark:hover:bg-slate-700 text-[#36423b] dark:text-slate-200 border border-[#e0dbd1] dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="إدارة الخصائص المخصصة للمشاريع (شبيه بـ Notion)"
            >
              <Sliders className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
              <span>الخصائص المخصصة</span>
              {customFields.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#174235] dark:bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                  {customFields.length}
                </span>
              )}
            </button>

            <button
              onClick={onNewProject}
              className="flex items-center gap-1 px-3.5 py-2 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مشروع جديد</span>
            </button>
          </div>
        </div>

        {/* View Switcher & Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0eee9] dark:border-slate-800">
          
          {/* View Mode Buttons */}
          <div className="flex items-center bg-[#f4f2ec] dark:bg-slate-800 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#174235] dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-[#637068] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>عرض البطاقات</span>
            </button>

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
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: `كل الحالات (${projects.length})` },
                { value: 'in_progress', label: 'قيد التنفيذ', icon: '🟡' },
                { value: 'completed', label: 'مكتمل', icon: '🟢' },
                { value: 'planned', label: 'مخطط له', icon: '⚪' },
                { value: 'on_hold', label: 'معلق', icon: '⏸️' },
              ]}
              prefixIcon={<Filter className="w-3.5 h-3.5 text-[#7d8982] dark:text-slate-400" />}
              size="xs"
              buttonClassName="rounded-xl py-1 px-2.5 bg-[#f8f7f4] dark:bg-slate-800 border-[#e3dfd7] dark:border-slate-700"
            />

            {goals.length > 0 && (
              <CustomSelect
                value={goalFilter}
                onChange={(val) => setGoalFilter(val)}
                options={[
                  { value: 'all', label: 'كل أهداف القيمة' },
                  ...goals.map((g) => ({ value: g.id, label: g.title })),
                ]}
                size="xs"
                buttonClassName="rounded-xl py-1 px-2.5 bg-[#f8f7f4] dark:bg-slate-800 border-[#e3dfd7] dark:border-slate-700 max-w-[150px] truncate"
              />
            )}
          </div>

        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-[#7d8982] dark:text-slate-400">
          لا توجد مشروعات مطابقة للمحددات الحالية.
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------------- */}
          {/* 1. VIEW MODE: GRID CARDS */}
          {/* ------------------------------------------------------------- */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((proj) => {
                const parentGoal = getParentGoal(proj.goal_id);
                const projectTasks = tasks.filter((t) => t.project_id === proj.id);
                const completedTasks = projectTasks.filter((t) => t.status === 'done').length;

                return (
                  <div
                    key={proj.id}
                    className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 hover:border-[#174235]/40 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          proj.status === 'completed'
                            ? 'bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 border border-[#cfe3d9] dark:border-emerald-800'
                            : proj.status === 'in_progress'
                            ? 'bg-[#fef7ea] dark:bg-amber-950/60 text-[#916b1e] dark:text-amber-300 border border-[#f3e5c8] dark:border-amber-900'
                            : proj.status === 'on_hold'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
                            : 'bg-[#f4f2ec] dark:bg-slate-800 text-[#55635b] dark:text-slate-300 border border-[#ded8cc] dark:border-slate-700'
                        }`}>
                          {proj.status === 'completed' && 'مكتمل'}
                          {proj.status === 'in_progress' && 'قيد التنفيذ'}
                          {proj.status === 'planned' && 'مخطط له'}
                          {proj.status === 'on_hold' && 'معلق'}
                        </span>

                        {parentGoal && (
                          <span className="text-[11px] text-[#717e76] dark:text-slate-400 font-medium truncate max-w-[150px]">
                            🎯 {parentGoal.title}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectProject(proj.id, proj.goal_id)}
                        className="font-bold text-sm text-[#1a2420] dark:text-slate-100 hover:text-[#174235] dark:hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        {proj.title}
                      </h3>

                      {proj.description && (
                        <p className="text-xs text-[#636e67] dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>
                      )}

                      {/* Custom Fields in Card */}
                      {customFields.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {customFields.map((f) => {
                            const val = proj.custom_fields?.[f.id];
                            if (val !== undefined && val !== null && val !== '') {
                              return (
                                <span
                                  key={f.id}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#f0eee9] dark:bg-slate-800 border border-[#ded9cf] dark:border-slate-700 text-[#3d4b43] dark:text-slate-300"
                                >
                                  <span className="text-[#808d85] dark:text-slate-400">{f.name}:</span>{' '}
                                  <span className="font-bold">{String(val)}</span>
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#f0ede6] dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-[#636e67] dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
                          <span>{completedTasks} من {projectTasks.length} مهام</span>
                        </div>
                        <span className="font-bold font-mono text-[#1a2420] dark:text-slate-200">
                          {Math.round(proj.progress)}%
                        </span>
                      </div>

                      <ProgressBar progress={proj.progress} size="sm" showPercentage={false} />

                      <div className="flex items-center justify-between text-[11px] text-[#7d8982] dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#9aa69f] dark:text-slate-500" />
                          <span>{proj.due_date || 'بدون تاريخ'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditProject(proj)}
                            className="p-1.5 text-[#85928a] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-100 rounded hover:bg-[#f4f2ec] dark:hover:bg-slate-800 cursor-pointer"
                            title="تعديل المشروع"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProject(proj.id)}
                            className="p-1.5 text-[#85928a] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                            title="حذف المشروع"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectProject(proj.id, proj.goal_id)}
                            className="p-1.5 text-[#174235] dark:text-emerald-400 hover:bg-[#ebf4f0] dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="فتح تفاصيل المشروع ومهامه"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 2. VIEW MODE: LIST VIEW */}
          {/* ------------------------------------------------------------- */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl divide-y divide-[#f0ede6] dark:divide-slate-800 shadow-2xs overflow-hidden">
              {filteredProjects.map((proj) => {
                const parentGoal = getParentGoal(proj.goal_id);
                const projectTasks = tasks.filter((t) => t.project_id === proj.id);
                const completedTasks = projectTasks.filter((t) => t.status === 'done').length;

                return (
                  <div
                    key={proj.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#fcfbfa] dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                          proj.status === 'completed'
                            ? 'bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300'
                            : proj.status === 'in_progress'
                            ? 'bg-[#fef7ea] dark:bg-amber-950/60 text-[#916b1e] dark:text-amber-300'
                            : 'bg-[#f4f2ec] dark:bg-slate-800 text-[#55635b] dark:text-slate-300'
                        }`}>
                          {proj.status === 'completed' && 'مكتمل'}
                          {proj.status === 'in_progress' && 'قيد التنفيذ'}
                          {proj.status === 'planned' && 'مخطط'}
                          {proj.status === 'on_hold' && 'معلق'}
                        </span>

                        <h3
                          onClick={() => onSelectProject(proj.id, proj.goal_id)}
                          className="font-bold text-xs sm:text-sm text-[#1a2420] dark:text-slate-100 hover:text-[#174235] dark:hover:text-emerald-400 cursor-pointer truncate"
                        >
                          {proj.title}
                        </h3>

                        {parentGoal && (
                          <span className="text-[11px] text-[#717e76] dark:text-slate-400 font-medium truncate hidden md:inline">
                            🎯 {parentGoal.title}
                          </span>
                        )}
                      </div>

                      {/* Custom fields in row */}
                      {customFields.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {customFields.map((f) => {
                            const val = proj.custom_fields?.[f.id];
                            if (val !== undefined && val !== null && val !== '') {
                              return (
                                <span
                                  key={f.id}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#f0eee9] dark:bg-slate-800 text-[#3d4b43] dark:text-slate-300"
                                >
                                  {f.name}: <strong>{String(val)}</strong>
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                      <div className="w-28 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#7d8982] dark:text-slate-400">{completedTasks}/{projectTasks.length}</span>
                          <span className="font-bold font-mono">{Math.round(proj.progress)}%</span>
                        </div>
                        <ProgressBar progress={proj.progress} size="sm" showPercentage={false} />
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#7d8982] dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-[#9aa69f] dark:text-slate-500" />
                        <span>{proj.due_date || '—'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditProject(proj)}
                          className="p-1.5 text-[#85928a] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-100 rounded hover:bg-[#f4f2ec] dark:hover:bg-slate-800 cursor-pointer"
                          title="تعديل المشروع"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1.5 text-[#85928a] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                          title="حذف المشروع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectProject(proj.id, proj.goal_id)}
                          className="p-1.5 text-[#174235] dark:text-emerald-400 hover:bg-[#ebf4f0] dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="فتح تفاصيل المشروع"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 3. VIEW MODE: KANBAN BOARD */}
          {/* ------------------------------------------------------------- */}
          {viewMode === 'board' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['planned', 'in_progress', 'on_hold', 'completed'] as const).map((statusKey) => {
                const colProjects = filteredProjects.filter((p) => p.status === statusKey);
                const colLabels = {
                  planned: { label: 'مخطط له', color: 'text-slate-600', icon: <Hourglass className="w-3.5 h-3.5 text-slate-500" /> },
                  in_progress: { label: 'قيد التنفيذ', color: 'text-amber-600', icon: <Clock className="w-3.5 h-3.5 text-amber-500" /> },
                  on_hold: { label: 'معلق', color: 'text-rose-600', icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> },
                  completed: { label: 'مكتمل', color: 'text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
                }[statusKey];

                return (
                  <div
                    key={statusKey}
                    className="bg-[#f7f5f1] dark:bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-[#e8e4db] dark:border-slate-800 flex flex-col space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#e2ddd3] dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {colLabels.icon}
                        <span className="font-bold text-xs text-[#2a352f] dark:text-slate-200">{colLabels.label}</span>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-[#ded8cc] dark:border-slate-700 text-[#55635b] dark:text-slate-300">
                        {colProjects.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] no-scrollbar">
                      {colProjects.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-[#8e9c94] dark:text-slate-500 border border-dashed border-[#ddd8cd] dark:border-slate-800 rounded-xl">
                          لا توجد مشاريع
                        </div>
                      ) : (
                        colProjects.map((proj) => {
                          const parentGoal = getParentGoal(proj.goal_id);
                          const projectTasks = tasks.filter((t) => t.project_id === proj.id);
                          const completedTasks = projectTasks.filter((t) => t.status === 'done').length;

                          return (
                            <div
                              key={proj.id}
                              className="p-3 bg-white dark:bg-slate-800 border border-[#e5e1d7] dark:border-slate-700 rounded-xl shadow-2xs hover:shadow-xs transition-all space-y-2 group"
                            >
                              <div className="space-y-1">
                                {parentGoal && (
                                  <span className="text-[10px] text-[#717e76] dark:text-slate-400 font-medium block truncate">
                                    🎯 {parentGoal.title}
                                  </span>
                                )}
                                <h4
                                  onClick={() => onSelectProject(proj.id, proj.goal_id)}
                                  className="text-xs font-bold text-[#1a2420] dark:text-slate-100 hover:text-[#174235] dark:hover:text-emerald-400 cursor-pointer transition-colors leading-snug"
                                >
                                  {proj.title}
                                </h4>
                              </div>

                              <div className="space-y-1 pt-1">
                                <div className="flex items-center justify-between text-[10px] text-[#636e67] dark:text-slate-400">
                                  <span>{completedTasks}/{projectTasks.length} مهام</span>
                                  <span className="font-mono font-bold">{Math.round(proj.progress)}%</span>
                                </div>
                                <ProgressBar progress={proj.progress} size="sm" showPercentage={false} />
                              </div>

                              {/* Custom Fields */}
                              {customFields.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 pt-1">
                                  {customFields.map((f) => {
                                    const val = proj.custom_fields?.[f.id];
                                    if (val !== undefined && val !== null && val !== '') {
                                      return (
                                        <span
                                          key={f.id}
                                          className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#f0ede6] dark:bg-slate-700 text-[#3d4b43] dark:text-slate-300 truncate max-w-[120px]"
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
                                <span className="font-mono">{proj.due_date || '—'}</span>

                                {/* Quick status move buttons */}
                                <div className="flex items-center gap-1">
                                  {statusKey !== 'in_progress' && (
                                    <button
                                      onClick={() => handleStatusChangeInternal(proj.id, 'in_progress')}
                                      className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-900 dark:text-amber-300 text-[9px] font-medium cursor-pointer"
                                      title="نقل إلى قيد التنفيذ"
                                    >
                                      تنفيذ
                                    </button>
                                  )}
                                  {statusKey !== 'completed' && (
                                    <button
                                      onClick={() => handleStatusChangeInternal(proj.id, 'completed')}
                                      className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 text-emerald-900 dark:text-emerald-300 text-[9px] font-medium cursor-pointer"
                                      title="نقل إلى مكتمل"
                                    >
                                      إكمال ✓
                                    </button>
                                  )}
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
          )}
        </>
      )}

      {/* Notion Custom Fields Manager Modal */}
      <CustomFieldsManagerModal
        isOpen={isFieldsModalOpen}
        onClose={() => setIsFieldsModalOpen(false)}
        entityType="project"
        fields={customFields}
        onFieldsChanged={onCustomFieldsChange}
      />
    </div>
  );
};
