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
      
      {/* 0. HERO SPOTLIGHT: أفضل مهمة للقيام بها الآن (Next Best Action) */}
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

      {/* Clean Light Header (replacing the old dark banner) */}
      <div className="bg-white border border-[#e8e5de] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">🏛️</span>
              <h1 className="text-lg sm:text-xl font-black text-[#1a2420]">
                الركائز الأساسية (Pillars)
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9]">
                {pillars.length} ركائز
              </span>
            </div>
            <p className="text-xs text-[#636e67]">
              المجالات الكبرى للحياة. يتم حساب نسب الإنجاز تصاعدياً تلقائياً من المهام حتى الركائز.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenSqlModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#f6f5f1] text-[#3a443f] border border-[#e3dfd7] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="عرض كود SQL التأسيسي لـ Supabase والتريجرات"
            >
              <Database className="w-3.5 h-3.5 text-[#174235]" />
              <span>مخطط SQL</span>
            </button>

            <button
              onClick={onNewPillar}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ركيزة جديدة</span>
            </button>
          </div>
        </div>

        {/* Group Filter Tabs in soft beige / green accent */}
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[#f0eee9] overflow-x-auto text-xs">
          <span className="text-[#838d86] font-medium pl-1 text-[11px]">المجموعة:</span>
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap ${
                selectedGroup === group
                  ? 'bg-[#174235] text-white shadow-2xs'
                  : 'text-[#5b6660] hover:text-[#174235] hover:bg-[#f2efe9]'
              }`}
            >
              {group === 'all' ? 'جميع الركائز' : group}
            </button>
          ))}
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPillars.map((pillar) => (
          <div
            key={pillar.id}
            className="bg-white border border-[#e8e5de] hover:border-[#174235]/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
          >
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#f3f0e8] text-[#555047]">
                    أولوية #{pillar.priority}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#ebf4f0] text-[#174235] border border-[#d6e9df]">
                    {pillar.pillar_group}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditPillar(pillar)}
                    className="p-1 text-[#838d86] hover:text-[#1a2420] rounded transition-colors cursor-pointer"
                    title="تعديل الركيزة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePillar(pillar.id)}
                    className="p-1 text-[#838d86] hover:text-rose-600 rounded transition-colors cursor-pointer"
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
                  className="font-black text-base text-[#1a2420] group-hover:text-[#174235] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>{pillar.title}</span>
                </h3>
                {pillar.description && (
                  <p className="text-xs text-[#636e67] mt-1 line-clamp-2 leading-relaxed">
                    {pillar.description}
                  </p>
                )}
              </div>

              {/* The Purpose (The Big Why) */}
              {pillar.purpose && (
                <div className="bg-[#faf8f4] border border-[#ede7dc] rounded-xl p-3 text-[11px] text-[#4b4335] leading-relaxed">
                  <span className="font-bold block text-[10px] text-[#916b1e] mb-0.5 uppercase tracking-wide">
                    الغاية التوجيهية (Purpose):
                  </span>
                  <p className="line-clamp-2 italic font-medium">«{pillar.purpose}»</p>
                </div>
              )}
            </div>

            {/* Bottom Progress and Navigation */}
            <div className="pt-3 border-t border-[#f0eee9] space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#3a443f]">
                  <span className="text-[11px] font-semibold text-[#838d86]">نسبة التقدم الكلي:</span>
                  <span className="font-mono text-[#174235] text-xs font-bold">{pillar.progress}%</span>
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
                onClick={() => onSelectPillar(pillar.id)}
                className="w-full py-2 px-3 bg-[#f8f7f4] hover:bg-[#ebf4f0] text-[#174235] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] group-hover:border-[#cfe3d9] cursor-pointer"
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
