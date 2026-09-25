import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft } from 'lucide-react';
import { Pillar, Task, Project, ValueGoal } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';
import { NextBestTaskSpotlight } from './NextBestTaskSpotlight';
import { PrayerTimesCard } from './PrayerTimesCard';

interface PillarsListViewProps {
  pillars: Pillar[];
  tasks?: Task[];
  projects?: Project[];
  goals?: ValueGoal[];
  onSelectPillar: (pillarId: string) => void;
  onNewPillar: () => void;
  onEditPillar: (pillar: Pillar) => void;
  onDeletePillar: (pillarId: string) => void;
  onOpenSqlModal?: () => void;
  onStartFocus?: (task: Task) => void;
  onCompleteTask?: (taskId: string) => void;
  onOpenTimeBlocking?: () => void;
  onSelectProject?: (projectId: string) => void;
  onAdhanNotify?: (prayerName: string) => void;
}

export const PillarsListView: React.FC<PillarsListViewProps> = ({
  pillars,
  tasks,
  projects,
  goals,
  onSelectPillar,
  onNewPillar,
  onEditPillar,
  onDeletePillar,
  onOpenSqlModal,
  onStartFocus,
  onCompleteTask,
  onOpenTimeBlocking,
  onSelectProject,
  onAdhanNotify,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const groups = ['all', ...Array.from(new Set(pillars.map((p) => p.pillar_group)))];
  const sortedPillars = [...pillars].sort((a, b) => a.priority - b.priority);

  const filteredPillars = sortedPillars.filter((p) => {
    if (selectedGroup !== 'all' && p.pillar_group !== selectedGroup) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 0. HERO SPOTLIGHT: أفضل مهمة للقيام بها الآن */}
      {tasks && projects && goals && onStartFocus && onCompleteTask && (
        <NextBestTaskSpotlight
          tasks={tasks}
          projects={projects}
          goals={goals}
          pillars={pillars}
          onStartFocus={onStartFocus}
          onCompleteTask={onCompleteTask}
          onOpenTimeBlocking={onOpenTimeBlocking}
          onSelectProject={onSelectProject}
        />
      )}

      {/* 1. Daily Prayer Times & Adhan Schedule */}
      <PrayerTimesCard onAdhanNotify={onAdhanNotify} />

      {/* 2. Pillars Header Section */}
      <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">🏛️</span>
              <h1 className="text-lg sm:text-xl font-black text-[#1a2420] dark:text-slate-100">
                الركائز الأساسية
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 border border-[#cfe3d9] dark:border-emerald-800">
                {pillars.length} ركائز
              </span>
            </div>
            <p className="text-xs text-[#636e67] dark:text-slate-400">
              المجالات الكبرى للحياة. يتم حساب نسب الإنجاز تصاعدياً تلقائياً من المهام حتى الركائز.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onNewPillar}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ركيزة جديدة</span>
            </button>
          </div>
        </div>

        {/* Group Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[#f0eee9] dark:border-slate-800 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[#838d86] dark:text-slate-400 font-medium pl-1 text-[11px] shrink-0">المجموعة:</span>
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap shrink-0 ${
                selectedGroup === group
                  ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#5b6660] dark:text-slate-300 hover:text-[#174235] dark:hover:text-emerald-300 hover:bg-[#f2efe9] dark:hover:bg-slate-800'
              }`}
            >
              {group === 'all' ? 'جميع الركائز' : group}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPillars.map((pillar) => (
          <div
            key={pillar.id}
            className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 hover:border-[#174235]/40 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
          >
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#f3f0e8] dark:bg-slate-800 text-[#555047] dark:text-slate-300 border border-[#e4dfd5] dark:border-slate-700">
                    أولوية #{pillar.priority}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 border border-[#d6e9df] dark:border-emerald-800">
                    {pillar.pillar_group}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditPillar(pillar)}
                    className="p-1 text-[#838d86] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-100 rounded transition-colors cursor-pointer"
                    title="تعديل الركيزة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePillar(pillar.id)}
                    className="p-1 text-[#838d86] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                    title="حذف الركيزة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3
                  onClick={() => onSelectPillar(pillar.id)}
                  className="font-black text-base text-[#1a2420] dark:text-slate-100 group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>{pillar.title}</span>
                </h3>
                {pillar.description && (
                  <p className="text-xs text-[#636e67] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {pillar.description}
                  </p>
                )}
              </div>

              {/* The Purpose */}
              {pillar.purpose && (
                <div className="bg-[#faf8f4] dark:bg-slate-800/80 border border-[#ede7dc] dark:border-slate-700 rounded-xl p-3 text-[11px] text-[#4b4335] dark:text-slate-300 leading-relaxed">
                  <span className="font-bold block text-[10px] text-[#916b1e] dark:text-amber-400 mb-0.5 uppercase tracking-wide">
                    الغاية التوجيهية:
                  </span>
                  <p className="line-clamp-2 italic font-medium">«{pillar.purpose}»</p>
                </div>
              )}
            </div>

            {/* Bottom Progress and Navigation */}
            <div className="pt-3 border-t border-[#f0eee9] dark:border-slate-800 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#3a443f] dark:text-slate-300">
                  <span className="text-[11px] font-semibold text-[#838d86] dark:text-slate-400">نسبة التقدم الكلي:</span>
                  <span className="font-mono text-[#174235] dark:text-emerald-400 text-xs font-bold">{pillar.progress}%</span>
                </div>
                <ProgressBar
                  progress={pillar.progress}
                  variant="both"
                  maxStars={5}
                  size="sm"
                  showPercentage={false}
                />
              </div>

              {/* Drill-down button */}
              <button
                type="button"
                onClick={() => onSelectPillar(pillar.id)}
                className="w-full py-2 px-3 bg-[#f8f7f4] dark:bg-slate-800 hover:bg-[#ebf4f0] dark:hover:bg-slate-700 text-[#174235] dark:text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-slate-700 group-hover:border-[#cfe3d9] dark:group-hover:border-emerald-800 cursor-pointer"
              >
                <span>الدخول واستعراض الرؤى والأهداف</span>
                <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
