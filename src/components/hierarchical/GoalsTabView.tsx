import React, { useState } from 'react';
import { Target, Plus, Edit2, Trash2, Calendar, ChevronLeft, Filter } from 'lucide-react';
import { ValueGoal, Vision, Pillar } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';
import { CustomSelect } from './CustomSelect';

interface GoalsTabViewProps {
  goals: ValueGoal[];
  visions: Vision[];
  pillars: Pillar[];
  onSelectGoal: (goalId: string, visionId?: string, pillarId?: string) => void;
  onNewGoal: () => void;
  onEditGoal: (goal: ValueGoal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalsTabView: React.FC<GoalsTabViewProps> = ({
  goals,
  visions,
  pillars,
  onSelectGoal,
  onNewGoal,
  onEditGoal,
  onDeleteGoal,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredGoals = goals.filter((g) => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    return true;
  });

  const getParentVision = (visionId?: string | null) => visions.find((v) => v.id === visionId);
  const getParentPillar = (pillarId: string) => pillars.find((p) => p.id === pillarId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e8e5de] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9] flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#1a2420]">أهداف القيمة (Value Goals)</h1>
            <p className="text-xs text-[#636e67]">
              الأهداف الاستراتيجية التي تقود إلى تحقيق الرؤى وترتبط مباشرة بالمشاريع التنفيذية.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: `كل الحالات (${goals.length})` },
              { value: 'in_progress', label: 'قيد العمل', icon: '🟡' },
              { value: 'completed', label: 'مكتمل', icon: '🟢' },
              { value: 'not_started', label: 'لم يبدأ', icon: '⚪' },
            ]}
            prefixIcon={<Filter className="w-3.5 h-3.5 text-[#7d8982]" />}
            size="xs"
            buttonClassName="rounded-xl py-1 px-2.5 bg-[#f8f7f4] border-[#e3dfd7]"
          />

          <button
            onClick={onNewGoal}
            className="flex items-center gap-1 px-3.5 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>هدف جديد</span>
          </button>
        </div>
      </div>

      {/* Grid of Goals */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white border border-[#e8e5de] rounded-2xl p-12 text-center text-xs text-[#7d8982]">
          لا توجد أهداف مطابقة للمحددات الحالية.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const parentVision = getParentVision(goal.vision_id);
            const parentPillar = getParentPillar(goal.pillar_id);

            return (
              <div
                key={goal.id}
                className="bg-white border border-[#e8e5de] hover:border-[#174235]/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      goal.status === 'completed'
                        ? 'bg-[#ebf4f0] text-[#174235] border border-[#cfe3d9]'
                        : goal.status === 'in_progress'
                        ? 'bg-[#fef7ea] text-[#916b1e] border border-[#f3e5c8]'
                        : 'bg-[#f3f0e8] text-[#555047]'
                    }`}>
                      {goal.status === 'completed' ? '✓ مكتمل' : goal.status === 'in_progress' ? '⏳ قيد التحقيق' : '○ لم يبدأ'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditGoal(goal)}
                        className="p-1 text-[#838f87] hover:text-[#1a2420] rounded cursor-pointer"
                        title="تعديل الهدف"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1 text-[#838f87] hover:text-rose-600 rounded cursor-pointer"
                        title="حذف الهدف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    {/* Ancestor tags */}
                    <div className="flex flex-wrap items-center gap-1 mb-1.5">
                      {parentPillar && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#f4f2ec] text-[#48534d] font-medium truncate max-w-[140px]">
                          🏛️ {parentPillar.title}
                        </span>
                      )}
                      {parentVision && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#ebf4f0] text-[#174235] font-medium truncate max-w-[150px]">
                          👁️ {parentVision.title}
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onSelectGoal(goal.id, goal.vision_id || undefined, goal.pillar_id)}
                      className="font-bold text-sm text-[#1a2420] group-hover:text-[#174235] transition-colors cursor-pointer"
                    >
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-[#636e67] mt-1 line-clamp-2 leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center gap-1 text-[11px] text-[#7d8982] font-mono">
                      <Calendar className="w-3 h-3 text-[#9aa59e]" />
                      <span>تاريخ الاستحقاق: {goal.target_date}</span>
                    </div>
                  )}
                </div>

                {/* Progress rollup */}
                <div className="pt-3 border-t border-[#f0eee9] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#738078]">التقدم (من مشاريعه):</span>
                    <span className="text-[11px] font-mono font-bold text-[#174235]">{goal.progress}%</span>
                  </div>
                  <ProgressBar progress={goal.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                  <button
                    onClick={() => onSelectGoal(goal.id, goal.vision_id || undefined, goal.pillar_id)}
                    className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] hover:bg-[#ebf4f0] text-[#174235] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] group-hover:border-[#cfe3d9] cursor-pointer"
                  >
                    <span>الدخول وتصفح المشاريع (Projects)</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
