import React from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { Project, Task } from '../types';
import { calculateWorkspaceStats } from '../utils/progressCalculator';

interface StatsCardsProps {
  projects: Project[];
  tasks: Task[];
  onFilterOverdue?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  projects,
  tasks,
  onFilterOverdue,
}) => {
  const stats = calculateWorkspaceStats(projects, tasks);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      
      {/* 1. إجمالي المشاريع */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">المشاريع النشطة</span>
          <FolderKanban className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.activeProjects}
            <span className="text-xs font-normal text-slate-500 mr-1.5">
              من أصل {stats.totalProjects}
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-600">
            {stats.completedProjects} مكتمل
          </span>
        </div>
      </div>

      {/* 2. متوسط نسبة الإنجاز */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">متوسط تقدم المشاريع</span>
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats.averageProjectProgress}%
            </span>
            <span className="text-xs text-slate-500">حساب وزني تراكمي</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.averageProjectProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. المهام المنجزة */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">المهام المكتملة</span>
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.completedTasks}
            <span className="text-xs font-normal text-slate-500 mr-1.5">
              / {stats.totalTasks}
            </span>
          </div>
          <span className="text-xs font-medium text-indigo-600">
            {stats.overallTaskProgress}%
          </span>
        </div>
      </div>

      {/* 4. ساعات العمل والتقدير */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">ساعات العمل والإنجاز</span>
          <Clock className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.totalLoggedHours}
            <span className="text-xs font-normal text-slate-500 mr-1">ساعة مسجلة</span>
          </div>
          <span className="text-xs text-slate-500">
            من {stats.totalEstimatedHours} س مقدرة
          </span>
        </div>
      </div>

      {/* 5. المهام المتأخرة أو العاجلة */}
      <div 
        onClick={onFilterOverdue}
        className={`bg-white border rounded-lg p-3.5 flex flex-col justify-between transition-colors ${
          stats.overdueTasks > 0
            ? 'border-amber-300 hover:bg-amber-50/50 cursor-pointer'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">المهام المتأخرة</span>
          <AlertTriangle className={`w-4 h-4 ${stats.overdueTasks > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className={`text-2xl font-bold tracking-tight ${stats.overdueTasks > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {stats.overdueTasks}
            <span className="text-xs font-normal text-slate-500 mr-1.5">
              تجاوزت الموعد
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {stats.overdueTasks > 0 ? 'تحتاج تدخل' : 'الجدول منضبط'}
          </span>
        </div>
      </div>

    </div>
  );
};
