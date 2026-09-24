import React, { useState } from 'react';
import { 
  SystemReview, 
  ReviewFrequency, 
  Pillar, 
  Vision, 
  ValueGoal, 
  Project, 
  Task, 
  ReviewActionItem 
} from '../../types/hierarchical';
import { 
  Activity, 
  Sparkles, 
  Plus, 
  Calendar, 
  Star, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  CheckSquare, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { generateSystemSnapshot, calculateSystemHealthScore } from '../../utils/reviewEngine';

interface ReviewsTabViewProps {
  reviews: SystemReview[];
  pillars: Pillar[];
  visions: Vision[];
  goals: ValueGoal[];
  projects: Project[];
  tasks: Task[];
  onNewReview: (freq?: ReviewFrequency) => void;
  onEditReview: (review: SystemReview) => void;
  onDeleteReview: (reviewId: string) => void;
  onConvertActionToTask: (actionItem: ReviewActionItem, reviewId: string) => void;
}

export const ReviewsTabView: React.FC<ReviewsTabViewProps> = ({
  reviews,
  pillars,
  visions,
  goals,
  projects,
  tasks,
  onNewReview,
  onEditReview,
  onDeleteReview,
  onConvertActionToTask,
}) => {
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Live snapshot of current system health
  const liveSnapshot = generateSystemSnapshot(pillars, visions, goals, projects, tasks);
  const liveHealthScore = calculateSystemHealthScore(liveSnapshot);

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (selectedFrequency === 'all') return true;
    return r.frequency === selectedFrequency;
  });

  const frequencyNames: Record<ReviewFrequency, string> = {
    daily: 'يومية',
    weekly: 'أسبوعية',
    monthly: 'شهرية',
    quarterly: 'ربع سنوية',
    yearly: 'سنوية',
  };

  const getPillar = (id?: string | null) => {
    if (!id || id === 'all') return null;
    return pillars.find((p) => p.id === id);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* 1. Header with Streamlined Live System Diagnostic Bar */}
      <div className="bg-white rounded-2xl border border-[#e8e4db] p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ebf4f0] text-[#174235] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-[#1a2420]">
                  المراجعات الدورية
                </h1>
                <span className="text-xs font-mono text-[#78857e] tabular-nums">
                  ({reviews.length} مراجعة مسجلة)
                </span>
              </div>
              <p className="text-xs text-[#6e7b74]">
                وقفات تأملية دورية لضبط البوصلة واستخراج مهام تصحيحية للمنظومة.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNewReview()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174235] hover:bg-[#12352a] text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>بدء مراجعة جديدة</span>
          </button>
        </div>

        {/* Streamlined Live Diagnostic Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#f0ede6] text-xs text-[#525f58]">
          <div className="flex items-center gap-2">
            <span className="text-[#78857e]">صحة المنظومة:</span>
            <span className="font-mono font-bold text-[#174235] tabular-nums text-sm">
              {liveHealthScore}/100
            </span>
            <span className="text-[11px] text-[#78857e]">
              ({liveHealthScore >= 80 ? 'ممتاز' : liveHealthScore >= 60 ? 'مستقر' : 'يحتاج تدخلاً'})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[#78857e]">إنجاز المهام:</span>
              <span className="font-mono font-semibold text-[#1a2420] tabular-nums">
                {liveSnapshot.tasks_completed_count} من {tasks.length}
              </span>
            </div>

            <span className="text-[#d8d4cc]">·</span>

            <div className="flex items-center gap-1">
              <span className="text-[#78857e]">المهام المتأخرة:</span>
              <span className={`font-mono font-semibold tabular-nums ${liveSnapshot.tasks_overdue_count > 0 ? 'text-rose-700' : 'text-emerald-800'}`}>
                {liveSnapshot.tasks_overdue_count}
              </span>
            </div>

            {liveSnapshot.top_active_pillar && (
              <>
                <span className="text-[#d8d4cc]">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#78857e]">الركيزة الأنشط:</span>
                  <span className="font-medium text-[#1a2420]">{liveSnapshot.top_active_pillar}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Frequency Filter Segmented Tabs */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto pt-2 border-t border-[#f0ede6]">
          <button
            onClick={() => setSelectedFrequency('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedFrequency === 'all'
                ? 'bg-[#174235] text-white'
                : 'text-[#637068] hover:text-[#1a2420] hover:bg-[#f4f2ec]'
            }`}
          >
            الكل <span className="font-mono tabular-nums text-[11px]">({reviews.length})</span>
          </button>
          {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as ReviewFrequency[]).map((freq) => {
            const count = reviews.filter(r => r.frequency === freq).length;
            return (
              <button
                key={freq}
                onClick={() => setSelectedFrequency(freq)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedFrequency === freq
                    ? 'bg-[#174235] text-white'
                    : 'text-[#637068] hover:text-[#1a2420] hover:bg-[#f4f2ec]'
                }`}
              >
                {frequencyNames[freq]} <span className="font-mono tabular-nums text-[11px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Reviews Feed List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-[#e8e4db] rounded-2xl p-10 text-center text-xs text-[#7d8982] space-y-2">
          <Activity className="w-8 h-8 text-[#174235] mx-auto opacity-30" />
          <p className="font-medium text-sm text-[#1a2420]">لا توجد مراجعات مسجلة في هذا التصنيف.</p>
          <p className="text-xs text-[#6e7b74] max-w-sm mx-auto">
            ابدأ جلسة مراجعة منتظمة لتحليل التقدم واستخراج مهام تصحيحية فورية.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const isExpanded = expandedReviewId === review.id;
            const targetPillar = getPillar(review.focus_pillar_id);

            return (
              <div
                key={review.id}
                className="bg-white border border-[#e8e4db] hover:border-[#174235]/40 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all space-y-3 group"
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#f0ede6] pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#78857e]">
                      <span className="font-semibold text-[#174235]">
                        مراجعة {frequencyNames[review.frequency]}
                      </span>
                      {targetPillar && (
                        <>
                          <span className="text-[#d8d4cc]">·</span>
                          <span className="text-[#525f58]">{targetPillar.title}</span>
                        </>
                      )}
                      <span className="text-[#d8d4cc]">·</span>
                      <span className="font-mono tabular-nums flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-[#9aa69f]" />
                        <span>{review.date}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[#1a2420]">
                      {review.title}
                    </h3>
                  </div>

                  {/* Clean Indicators */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs">
                    {review.rating && (
                      <div className="flex items-center gap-1 text-amber-600 font-mono font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{review.rating}/10</span>
                      </div>
                    )}

                    {review.system_health_score && (
                      <span className="font-mono font-medium text-[#174235] text-xs">
                        صحة: {review.system_health_score}%
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditReview(review)}
                        className="p-1.5 text-[#85928a] hover:text-[#1a2420] rounded hover:bg-[#f4f2ec] cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteReview(review.id)}
                        className="p-1.5 text-[#85928a] hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {review.wins && (
                    <div className="bg-[#faf9f6] border border-[#f0ede6] rounded-xl p-3 space-y-1">
                      <span className="font-medium text-[#174235] text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>أبرز الإنجازات:</span>
                      </span>
                      <p className="text-[#3a443e] leading-relaxed line-clamp-2">
                        {review.wins}
                      </p>
                    </div>
                  )}

                  {review.next_commitments && (
                    <div className="bg-[#faf9f6] border border-[#f0ede6] rounded-xl p-3 space-y-1">
                      <span className="font-medium text-[#174235] text-[11px] flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <span>التزامات الفترة القادمة:</span>
                      </span>
                      <p className="text-[#3a443e] leading-relaxed line-clamp-2">
                        {review.next_commitments}
                      </p>
                    </div>
                  )}
                </div>

                {/* Expand toggle */}
                <div className="pt-1 flex items-center justify-between text-xs text-[#78857e]">
                  <button
                    onClick={() => setExpandedReviewId(isExpanded ? null : review.id)}
                    className="flex items-center gap-1 hover:text-[#174235] cursor-pointer font-medium"
                  >
                    <span>{isExpanded ? 'إخفاء التفاصيل' : 'عرض التشخيص والمهام المستخرجة'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <span className="font-mono tabular-nums text-[11px]">
                    {review.action_items?.length || 0} مهام مستخرجة
                  </span>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#f0ede6] space-y-3 text-xs">
                    {review.challenges && (
                      <div className="bg-[#fff9f8] border border-[#fae2df] p-3 rounded-xl">
                        <span className="font-medium text-rose-700 block mb-0.5">العقبات والتحديات:</span>
                        <p className="text-[#4a3532] leading-relaxed">{review.challenges}</p>
                      </div>
                    )}

                    {review.action_items && review.action_items.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-medium text-[#1a2420] block">مهام تصحيحية مقترحة:</span>
                        <div className="divide-y divide-[#f0ede6] border border-[#e8e4db] rounded-xl overflow-hidden bg-white">
                          {review.action_items.map((action) => (
                            <div key={action.id} className="p-2.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <CheckSquare className="w-3.5 h-3.5 text-[#174235]" />
                                <span className={action.is_converted ? 'line-through text-[#85928a]' : 'text-[#1a2420]'}>
                                  {action.title}
                                </span>
                              </div>

                              {!action.is_converted && (
                                <button
                                  onClick={() => onConvertActionToTask(action, review.id)}
                                  className="px-2 py-1 text-[11px] bg-[#ebf4f0] text-[#174235] rounded-lg font-medium hover:bg-[#d8ece1] cursor-pointer"
                                >
                                  تحويل لمهمة
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
