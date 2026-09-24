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
      <div className="bg-white dark:bg-[#16201b] border border-slate-200 dark:border-[#223028] rounded-xl p-3.5 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-[#8ea095] mb-2">
          <span className="text-xs font-semibold">المشاريع النشطة</span>
          <FolderKanban className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
            {stats.activeProjects}
            <span className="text-xs font-normal text-slate-500 dark:text-[#8ea095] mr-1.5 font-sans">
              من أصل {stats.totalProjects}
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {stats.completedProjects} مكتمل
          </span>
        </div>
      </div>

      {/* 2. متوسط نسبة الإنجاز */}
      <div className="bg-white dark:bg-[#16201b] border border-slate-200 dark:border-[#223028] rounded-xl p-3.5 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-[#8ea095] mb-2">
          <span className="text-xs font-semibold">متوسط تقدم المشاريع</span>
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
              {stats.averageProjectProgress}%
            </span>
            <span className="text-xs text-slate-500 dark:text-[#8ea095]">حساب وزني تراكمي</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-[#1f2d25] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.averageProjectProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. المهام المنجزة */}
      <div className="bg-white dark:bg-[#16201b] border border-slate-200 dark:border-[#223028] rounded-xl p-3.5 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-[#8ea095] mb-2">
          <span className="text-xs font-semibold">المهام المكتملة</span>
          <CheckCircle2 className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
            {stats.completedTasks}
            <span className="text-xs font-normal text-slate-500 dark:text-[#8ea095] mr-1.5 font-sans">
              / {stats.totalTasks}
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {stats.overallTaskProgress}%
          </span>
        </div>
      </div>

      {/* 4. ساعات العمل والتقدير */}
      <div className="bg-white dark:bg-[#16201b] border border-slate-200 dark:border-[#223028] rounded-xl p-3.5 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-[#8ea095] mb-2">
          <span className="text-xs font-semibold">ساعات العمل والإنجاز</span>
          <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
            {stats.totalLoggedHours}
            <span className="text-xs font-normal text-slate-500 dark:text-[#8ea095] mr-1 font-sans">ساعة مسجلة</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-[#8ea095] font-mono tabular-nums">
            من {stats.totalEstimatedHours} س مقدرة
          </span>
        </div>
      </div>

      {/* 5. المهام المتأخرة أو العاجلة */}
      <div 
        onClick={onFilterOverdue}
        className={`bg-white dark:bg-[#16201b] border rounded-xl p-3.5 flex flex-col justify-between transition-colors shadow-2xs ${
          stats.overdueTasks > 0
            ? 'border-amber-300 dark:border-amber-800/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer'
            : 'border-slate-200 dark:border-[#223028]'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-[#8ea095] mb-2">
          <span className="text-xs font-semibold">المهام المتأخرة</span>
          <AlertTriangle className={`w-4 h-4 ${stats.overdueTasks > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-[#5a6a60]'}`} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${stats.overdueTasks > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {stats.overdueTasks}
            <span className="text-xs font-normal text-slate-500 dark:text-[#8ea095] mr-1.5 font-sans">
              تجاوزت الموعد
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-[#8ea095]">
            {stats.overdueTasks > 0 ? 'تحتاج تدخل' : 'الجدول منضبط'}
          </span>
        </div>
      </div>

    </div>
  );
};
