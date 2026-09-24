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
      
      {/* Vision Header Card */}
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0eee9] dark:border-[#223028] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ebf4f0] dark:bg-[#192b22] border border-[#cfe3d9] dark:border-[#264434] flex items-center justify-center text-[#174235] dark:text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-[#f4f2ec] dark:bg-[#1a2620] text-[#48534d] dark:text-[#c4d6cb] border border-[#e4dfd6] dark:border-[#283830]">
                  المجال: {pillar.title}
                </span>
                {vision.timeframe && (
                  <span className="text-[10px] text-[#174235] dark:text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{vision.timeframe}</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1a2420] dark:text-white mt-1">{vision.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEditVision(vision)}
              className="px-3 py-1.5 bg-[#f6f5f1] dark:bg-[#1a2620] hover:bg-[#ede9e1] dark:hover:bg-[#22332a] text-[#3f4b44] dark:text-[#c4d6cb] rounded-xl text-xs font-semibold cursor-pointer border border-[#e5e1d8] dark:border-[#283830] transition-colors"
            >
              تعديل الرؤية
            </button>
            <button
              type="button"
              onClick={onNewGoal}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة هدف</span>
            </button>
          </div>
        </div>

        {/* Vision Statement */}
        {vision.description && (
          <div className="bg-[#faf8f4] dark:bg-[#1a251f] rounded-xl p-4 border border-[#ece6db] dark:border-[#28382e] text-xs text-[#4b4335] dark:text-[#d7e4dc] leading-relaxed">
            <span className="text-[10px] font-bold text-[#8f691c] dark:text-amber-400 block mb-1 uppercase tracking-wider">
              بيان الرؤية والأفق المنشود:
            </span>
            <p className="text-sm font-medium text-[#2d281f] dark:text-[#e2eee7]">
              {vision.description}
            </p>
          </div>
        )}

        {/* Vision Progress Rollup Bar */}
        <div className="bg-[#f8f7f4] dark:bg-[#15211a] p-3 rounded-xl border border-[#ece8e0] dark:border-[#223228] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#647169] dark:text-[#9bb0a3] font-medium">تقدم الرؤية التراكمي (Rollup):</span>
            <span className="font-mono font-bold text-[#174235] dark:text-emerald-400 text-sm">{vision.progress}%</span>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar progress={vision.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />
          </div>
        </div>
      </div>

      {/* Value Goals List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1a2420] dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
            <span>الأهداف الاستراتيجية التابعة لهذه الرؤية</span>
          </h2>
          <p className="text-[11px] text-[#6d7972] dark:text-[#9bb0a3]">
            أهداف محددة وقابلة للقياس تصب مباشرة في تحقيق هذه الرؤية.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewGoal}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12352a] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>هدف جديد</span>
        </button>
      </div>

      {/* Value Goals Cards */}
      {valueGoals.length === 0 ? (
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-8 text-center text-xs text-[#7d8982] dark:text-[#9bb0a3]">
          لا توجد أهداف مسجلة تحت هذه الرؤية حتى الآن. ابدأ بإضافة الهدف الأول!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {valueGoals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] hover:border-[#174235]/40 dark:hover:border-emerald-500/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    goal.status === 'completed'
                      ? 'bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border border-[#cfe3d9] dark:border-[#264434]'
                      : goal.status === 'in_progress'
                      ? 'bg-[#fef7ea] dark:bg-[#272113] text-[#916b1e] dark:text-amber-400 border border-[#f3e5c8] dark:border-[#3d321d]'
                      : 'bg-[#f3f0e8] dark:bg-[#1f2823] text-[#555047] dark:text-[#9bb0a3]'
                  }`}>
                    {goal.status === 'completed' ? '✓ مكتمل' : goal.status === 'in_progress' ? '⏳ قيد التحقيق' : '○ لم يبدأ'}
                  </span>

                  <div className="flex items-center gap-1">
                    {goal.target_date && (
                      <span className="text-[10px] text-[#7d8982] dark:text-[#8ea095] flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{goal.target_date}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditGoal(goal)}
                      className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-[#1a2420] dark:hover:text-white rounded cursor-pointer"
                      title="تعديل الهدف"
                      aria-label="تعديل الهدف"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 text-[#838f87] dark:text-[#8ea095] hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
                      title="حذف الهدف"
                      aria-label="حذف الهدف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3
                    onClick={() => onSelectGoal(goal.id)}
                    className="font-bold text-sm text-[#1a2420] dark:text-white group-hover:text-[#174235] dark:group-hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-[#636e67] dark:text-[#9bb0a3] mt-1 line-clamp-2 leading-relaxed">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress and drill-down button */}
              <div className="pt-3 border-t border-[#f0eee9] dark:border-[#223028] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-[#738078] dark:text-[#8ea095]">نسبة التقدم:</span>
                  <span className="text-[11px] font-mono font-bold text-[#174235] dark:text-emerald-400">{goal.progress}%</span>
                </div>
                <ProgressBar progress={goal.progress} variant="both" maxStars={10} size="sm" showPercentage={false} />

                <button
                  type="button"
                  onClick={() => onSelectGoal(goal.id)}
                  className="w-full mt-2 py-2 px-3 bg-[#f8f7f4] dark:bg-[#1a2620] hover:bg-[#ebf4f0] dark:hover:bg-[#22332a] text-[#174235] dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#e7e3db] dark:border-[#283830] group-hover:border-[#cfe3d9] dark:group-hover:border-[#335544] cursor-pointer"
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
