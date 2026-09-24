import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, Database } from 'lucide-react';
import { Pillar, Task, Project, ValueGoal } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';
import { NextBestTaskSpotlight } from './NextBestTaskSpotlight';

interface PillarsListViewProps {
  pillars: Pillar[];
  tasks?: Task[];
  projects?: Project[];
  goals?: ValueGoal[];
  onSelectPillar: (pillarId: string) => void;
  onNewPillar: () => void;
  onEditPillar: (pillar: Pillar) => void;
  onDeletePillar: (pillarId: string) => void;
  onOpenSqlModal: () => void;
  onStartFocus?: (task: Task) => void;
  onCompleteTask?: (taskId: string) => void;
  onOpenTimeBlocking?: () => void;
  onSelectProject?: (projectId: string) => void;
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

      {/* Main Header */}
      <div className="bg-white dark:bg-[#16201b] border border-[#e8e5de] dark:border-[#223028] rounded-2xl p-5 sm:p-6 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm select-none" aria-hidden="true">🌱</span>
              <h1 className="text-lg sm:text-xl font-black text-[#1a2420] dark:text-white">
                مجالات الحياة (الركائز)
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-300">
                {pillars.length} مجالات
              </span>
            </div>
            <p className="text-xs text-[#636e67] dark:text-[#9bb0a3]">
              المجالات الكبرى لحياتك (العمل، الصحة، الأسرة، التطوير الذاتي). يتم حساب الإنجاز تلقائياً تصاعدياً من المهام اليومية.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenSqlModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1a2620] hover:bg-[#f6f5f1] dark:hover:bg-[#22332a] text-[#3a443f] dark:text-[#c4d6cb] border border-[#e3dfd7] dark:border-[#283830] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="عرض كود SQL التأسيسي لـ Supabase والتريجرات"
            >
              <Database className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
              <span>مخطط SQL</span>
            </button>

            <button
              type="button"
              onClick={onNewPillar}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مجال جديد</span>
            </button>
          </div>
        </div>

        {/* Group Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[#f0eee9] dark:border-[#223028] overflow-x-auto text-xs scrollbar-none">
          <span className="text-[#838d86] dark:text-[#788c80] font-medium pl-1 text-[11px] shrink-0">التصنيف:</span>
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                selectedGroup === group
                  ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#5b6660] dark:text-[#9bb0a3] hover:text-[#174235] dark:hover:text-white hover:bg-[#f2efe9] dark:hover:bg-[#1d2b23]'
              }`}
            >
              {group === 'all' ? 'جميع المجالات' : group}
            </button>
          ))}
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPillars.map((pillar) => (
          <div
            key={pillar.id}
            className="bg-white dark:bg-[#16201b] border border-[#e8e5de] dark:border-[#223028] hover:border-[#174235]/40 dark:hover:border-emerald-500/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
          >
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {/* Clean unboxed metadata with dot separator */}
                <div className="flex items-center gap-2 text-xs text-[#636e67] dark:text-[#9bb0a3]">
                  <span className="font-mono tabular-nums font-bold text-[#174235] dark:text-emerald-400">
                    أولوية #{pillar.priority}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium">
                    {pillar.pillar_group}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditPillar(pillar)}
                    aria-label={`تعديل مجال ${pillar.title}`}
                    className="p-1 text-[#838d86] dark:text-[#788c80] hover:text-[#1a2420] dark:hover:text-white rounded-lg hover:bg-[#f2efe8] dark:hover:bg-[#1f2e26] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePillar(pillar.id)}
                    aria-label={`حذف مجال ${pillar.title}`}
                    className="p-1 text-[#838d86] dark:text-[#788c80] hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-[#f2efe8] dark:hover:bg-[#1f2e26] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <button
                  type="button"
                  onClick={() => onSelectPillar(pillar.id)}
                  className="text-right font-black text-base text-[#1a2420] dark:text-white group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors cursor-pointer block w-full"
                >
                  {pillar.title}
                </button>
                {pillar.description && (
                  <p className="text-xs text-[#636e67] dark:text-[#9bb0a3] mt-1 line-clamp-2 leading-relaxed">
                    {pillar.description}
                  </p>
                )}
              </div>

              {/* The Purpose (The Big Why) */}
              {pillar.purpose && (
                <div className="bg-[#faf8f4] dark:bg-[#1a2520] border border-[#ede7dc] dark:border-[#26372d] rounded-xl p-3 text-[11px] text-[#4b4335] dark:text-[#d3e0d8] leading-relaxed">
                  <span className="font-bold block text-[10px] text-amber-700 dark:text-amber-400 mb-0.5">
                    الغاية والرسالة (Purpose):
                  </span>
                  <p className="line-clamp-2 italic font-medium">«{pillar.purpose}»</p>
                </div>
              )}
            </div>

            {/* Bottom Progress and Navigation */}
            <div className="pt-3 border-t border-[#f0eee9] dark:border-[#223028] space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#3a443f] dark:text-[#c4d6cb]">
                  <span className="text-[11px] font-semibold text-[#838d86] dark:text-[#9bb0a3]">نسبة الإنجاز المحسوبة:</span>
                  <span className="font-mono tabular-nums text-[#174235] dark:text-emerald-400 text-xs font-bold">{pillar.progress}%</span>
                </div>
                <ProgressBar
                  progress={pillar.progress}
                  variant="both"
                  maxStars={5}
                  size="sm"
                  showPercentage={false}
                  label={pillar.title}
                />
              </div>

              {/* Drill-down button */}
              <button
                type="button"
                onClick={() => onSelectPillar(pillar.id)}
                className="w-full py-2.5 px-3 bg-[#f8f7f4] dark:bg-[#1a2520] hover:bg-[#ebf4f0] dark:hover:bg-[#203328] text-[#174235] dark:text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-[#283830] group-hover:border-[#cfe3d9] dark:group-hover:border-emerald-600/40 cursor-pointer"
              >
                <span>استعراض الرؤى والأهداف التابعة</span>
                <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
