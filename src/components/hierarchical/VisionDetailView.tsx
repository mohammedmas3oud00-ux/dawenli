import React from 'react';
import { Plus, Edit2, Trash2, Target, Calendar, ChevronLeft, Eye, Clock } from 'lucide-react';
import { Pillar, Vision, ValueGoal } from '../../types/hierarchical';
import { ProgressBar } from './ProgressBar';

interface VisionDetailViewProps {
  pillar: Pillar;
  vision: Vision;
  valueGoals: ValueGoal[];
  onSelectGoal: (goalId: string) => void;
  onNewGoal: () => void;
  onEditGoal: (goal: ValueGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onEditVision: (vision: Vision) => void;
}

export const VisionDetailView: React.FC<VisionDetailViewProps> = ({
  pillar,
  vision,
  valueGoals,
  onSelectGoal,
  onNewGoal,
  onEditGoal,
  onDeleteGoal,
  onEditVision,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Clean Vision Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eee9] dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] dark:bg-emerald-950/70 border border-[#cfe3d9] dark:border-emerald-800 flex items-center justify-center text-[#174235] dark:text-emerald-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-[#f4f2ec] dark:bg-slate-800 text-[#48534d] dark:text-slate-300 border border-[#e4dfd6] dark:border-slate-700">
                  الركيزة: {pillar.title}
                </span>
                {vision.timeframe && (
                  <span className="text-[10px] text-[#174235] dark:text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{vision.timeframe}</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1a2420] dark:text-slate-100 mt-1">{vision.title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onEditVision(vision)}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#f6f5f1] dark:bg-slate-800 hover:bg-[#ede9e1] dark:hover:bg-slate-700 text-[#3f4b44] dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e1d8] dark:border-slate-700 transition-colors"
            >
              تعديل الرؤية
            </button>
            <button
              onClick={onNewGoal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة هدف قيمة</span>
            </button>
          </div>
        </div>

        {/* Vision Statement */}
        {vision.description && (
          <div className="bg-[#faf8f4] dark:bg-slate-800/60 rounded-xl p-4 border border-[#ece6db] dark:border-slate-700/80 text-xs text-[#4b4335] dark:text-slate-300 leading-relaxed">
            <span className="text-[10px] font-bold text-[#8f691c] dark:text-amber-400 block mb-1 uppercase tracking-wider">
              بيان الرؤية والأفق المنشود:
            </span>
            <p className="text-sm font-medium text-[#2d281f] dark:text-slate-200">
              {vision.description}
            </p>
          </div>
        )}

        {/* Vision Progress Rollup Bar */}
        <div className="bg-[#f8f7f4] dark:bg-slate-800/80 p-3 rounded-xl border border-[#ece8e0] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#647169] dark:text-slate-400 font-medium">تقدم الرؤية التقدم التراكمي:</span>
            <span className="font-mono font-extrabold text-[#174235] dark:text-emerald-400 text-sm">{vision.progress}%</span>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar progress={vision.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />
          </div>
        </div>
      </div>

      {/* Value Goals List Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#1a2420] dark:text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
            <span>أهداف القيمة التابعة لهذه الرؤية</span>
          </h2>
          <p className="text-[11px] text-[#6d7972] dark:text-slate-400">
            أهداف محددة وقابلة للقياس تصب مباشرة في تحقيق هذه الرؤية.
          </p>
        </div>

        <button
          onClick={onNewGoal}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12352a] dark:hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>هدف قيمة جديد</span>
        </button>
      </div>

      {/* Value Goals Cards */}
      {valueGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-[#7d8982] dark:text-slate-400">
          لا توجد أهداف قيمة مسجلة تحت هذه الرؤية حتى الآن. ابدأ بإضافة الهدف الأول!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {valueGoals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 hover:border-[#174235]/40 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    goal.status === 'completed'
                      ? 'bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 border border-[#cfe3d9] dark:border-emerald-800'
                      : goal.status === 'in_progress'
                      ? 'bg-[#fef7ea] dark:bg-amber-950/70 text-[#916b1e] dark:text-amber-300 border border-[#f3e5c8] dark:border-amber-800'
                      : 'bg-[#f3f0e8] dark:bg-slate-800 text-[#555047] dark:text-slate-400'
                  }`}>
                    {goal.status === 'completed' ? '✓ مكتمل' : goal.status === 'in_progress' ? '⏳ قيد التحقيق' : '○ لم يبدأ'}
                  </span>

                  <div className="flex items-center gap-1">
                    {goal.target_date && (
                      <span className="text-[10px] text-[#7d8982] dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{goal.target_date}</span>
                      </span>
                    )}
                    <button
                      onClick={() => onEditGoal(goal)}
                      className="p-1 text-[#838f87] dark:text-slate-400 hover:text-[#1a2420] dark:hover:text-slate-200 rounded cursor-pointer"
                      title="تعديل الهدف"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 text-[#838f87] dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
                      title="حذف الهدف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3
                    onClick={() => onSelectGoal(goal.id)}
                    className="font-bold text-sm text-[#1a2420] dark:text-slate-100 group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-[#636e67] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress and drill-down button */}
              <div className="pt-3 border-t border-[#f0eee9] dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-[#738078] dark:text-slate-400">نسبة التقدم:</span>
                  <span className="text-[11px] font-mono font-bold text-[#174235] dark:text-emerald-400">{goal.progress}%</span>
                </div>
                <ProgressBar progress={goal.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                <button
                  onClick={() => onSelectGoal(goal.id)}
                  className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] dark:bg-slate-800 hover:bg-[#ebf4f0] dark:hover:bg-slate-700 text-[#174235] dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-slate-700 group-hover:border-[#cfe3d9] dark:group-hover:border-emerald-800 cursor-pointer"
                >
                  <span>عرض المشاريع التابعة</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
