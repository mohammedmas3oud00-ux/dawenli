import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Play, 
  RotateCw, 
  Calendar, 
  Layers, 
  Folder, 
  AlertCircle,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Task, Project, ValueGoal, Pillar, EnergyLevel } from '../../types/hierarchical';
import { getRecommendedTasks } from '../../utils/taskRecommender';

interface NextBestTaskSpotlightProps {
  tasks: Task[];
  projects: Project[];
  goals: ValueGoal[];
  pillars: Pillar[];
  onStartFocus: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
  onOpenTimeBlocking?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export const NextBestTaskSpotlight: React.FC<NextBestTaskSpotlightProps> = ({
  tasks,
  projects,
  goals,
  pillars,
  onStartFocus,
  onCompleteTask,
  onOpenTimeBlocking,
  onSelectProject,
}) => {
  // State for user preferences
  const [availableMinutes, setAvailableMinutes] = useState<number>(45);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('high');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isCompletedAnim, setIsCompletedAnim] = useState<boolean>(false);

  // Compute recommendations
  const recommendations = useMemo(() => {
    return getRecommendedTasks(tasks, projects, goals, pillars, {
      availableMinutes,
      energyLevel,
      pillarId: selectedPillarFilter,
    });
  }, [tasks, projects, goals, pillars, availableMinutes, energyLevel, selectedPillarFilter]);

  // Safe current recommendation
  const currentRec = recommendations[currentIndex % (recommendations.length || 1)];

  const handleNextSuggestion = () => {
    if (recommendations.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % recommendations.length);
    }
  };

  const handleCompleteCurrent = () => {
    if (!currentRec) return;
    setIsCompletedAnim(true);
    setTimeout(() => {
      onCompleteTask(currentRec.task.id);
      setIsCompletedAnim(false);
      setCurrentIndex(0);
    }, 450);
  };

  return (
    <div className="bg-linear-to-br from-[#fbfaf7] to-[#f4f7f4] dark:from-slate-900 dark:to-slate-900/90 border border-[#dce6e0] dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs relative transition-all overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-48 h-48 bg-[#174235]/5 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-10 translate-y-10 w-44 h-44 bg-[#d1a153]/10 dark:bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Top Header Block: Full width to prevent text wrap collisions */}
      <div className="relative z-10 flex flex-col gap-3 pb-4 border-b border-[#e5ece7] dark:border-slate-800">
        
        {/* Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#174235] text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-[#f5d77f]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-[#174235] dark:text-emerald-400">
                  أفضل مهمة للقيام بها الآن
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#174235]/10 dark:bg-emerald-950 text-[#174235] dark:text-emerald-300 border border-[#174235]/20 dark:border-emerald-800">
                  خوارزمية المواءمة الذكية
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#526359] dark:text-slate-400 mt-0.5">
                اقتراح فوري مستند إلى وقتك المتاح، طاقتك الحالية، مواعيد الاستحقاق، والأولويات الاستراتيجية.
              </p>
            </div>
          </div>
        </div>

        {/* Clean Filter Row: Dedicated line with wrapping that NEVER overlaps */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          
          {/* Available Minutes Selector */}
          <div className="flex items-center bg-white dark:bg-slate-800 border border-[#d6dfd9] dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
            <span className="text-[11px] text-[#718278] dark:text-slate-400 font-bold px-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
              <span>الوقت:</span>
            </span>
            {[
              { val: 15, label: '15 د' },
              { val: 30, label: '30 د' },
              { val: 45, label: '45 د' },
              { val: 60, label: '60+ د' },
            ].map((t) => (
              <button
                key={t.val}
                type="button"
                onClick={() => {
                  setAvailableMinutes(t.val);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  availableMinutes === t.val
                    ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#526359] dark:text-slate-300 hover:bg-[#f0f4f1] dark:hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Energy Level Selector */}
          <div className="flex items-center bg-white dark:bg-slate-800 border border-[#d6dfd9] dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
            <span className="text-[11px] text-[#718278] dark:text-slate-400 font-bold px-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#d97706]" />
              <span>الطاقة:</span>
            </span>
            {[
              { val: 'high', label: 'عالية', icon: '⚡' },
              { val: 'medium', label: 'معتدلة', icon: '🔋' },
              { val: 'low', label: 'هادئة', icon: '☕' },
            ].map((e) => (
              <button
                key={e.val}
                type="button"
                onClick={() => {
                  setEnergyLevel(e.val as EnergyLevel);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  energyLevel === e.val
                    ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#526359] dark:text-slate-300 hover:bg-[#f0f4f1] dark:hover:bg-slate-700'
                }`}
              >
                <span>{e.icon}</span>
                <span>{e.label}</span>
              </button>
            ))}
          </div>

          {/* Pillar Filter: Clean, Non-overlapping Native Styled Select */}
          {pillars.length > 0 && (
            <div className="flex items-center bg-white dark:bg-slate-800 border border-[#d6dfd9] dark:border-slate-700 rounded-xl px-2 py-0.5 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400 ml-1.5 shrink-0" />
              <select
                value={selectedPillarFilter}
                onChange={(e) => {
                  setSelectedPillarFilter(e.target.value);
                  setCurrentIndex(0);
                }}
                className="bg-transparent text-xs font-bold text-[#174235] dark:text-emerald-300 py-1 outline-hidden cursor-pointer"
              >
                <option value="all">كافة الركائز</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Main Spotlight Body */}
      <div className="relative z-10 pt-4">
        {currentRec ? (
          <div className={`transition-all duration-300 ${isCompletedAnim ? 'opacity-30 scale-98 blur-2xs' : 'opacity-100 scale-100'}`}>
            <div className="bg-white dark:bg-slate-800/90 border border-[#cfe0d5] dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-[#174235]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5">
              
              {/* Task Details Section */}
              <div className="space-y-3 flex-1 min-w-0">
                
                {/* Score & Badges Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ebf5ef] dark:bg-emerald-950/70 border border-[#b9dbcb] dark:border-emerald-800 text-[#174235] dark:text-emerald-300 font-black text-xs shadow-2xs">
                    <Flame className="w-3.5 h-3.5 text-[#e67e22]" />
                    <span>درجة المواءمة: {currentRec.score}%</span>
                  </div>

                  {/* Urgency Badge */}
                  <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    currentRec.urgencyLabel.includes('متأخرة') 
                      ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                      : currentRec.urgencyLabel.includes('اليوم')
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                      : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                  }`}>
                    <AlertCircle className="w-3 h-3" />
                    <span>{currentRec.urgencyLabel}</span>
                  </div>

                  {/* Time & Energy Estimate */}
                  <span className="text-[11px] font-bold text-[#627369] dark:text-slate-300 bg-[#f5f3ee] dark:bg-slate-700/80 px-2.5 py-0.5 rounded-md border border-[#e4dfd5] dark:border-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#174235] dark:text-emerald-400" />
                    <span>~{currentRec.estimatedMinutes} دقيقة</span>
                  </span>

                  <span className="text-[11px] font-bold text-[#627369] dark:text-slate-300 bg-[#f5f3ee] dark:bg-slate-700/80 px-2.5 py-0.5 rounded-md border border-[#e4dfd5] dark:border-slate-600 flex items-center gap-1">
                    <span>{currentRec.requiredEnergy === 'high' ? '⚡ طاقة تركيز' : currentRec.requiredEnergy === 'medium' ? '🔋 طاقة معتدلة' : '☕ روتينية'}</span>
                  </span>

                  {recommendations.length > 1 && (
                    <span className="text-[11px] text-[#86968c] dark:text-slate-400 font-medium mr-auto">
                      المقترح {currentIndex + 1} من {recommendations.length}
                    </span>
                  )}
                </div>

                {/* Task Title */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1a2420] dark:text-slate-100 tracking-tight leading-snug">
                    {currentRec.task.title}
                  </h3>
                  {currentRec.task.description && (
                    <p className="text-xs text-[#526359] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {currentRec.task.description}
                    </p>
                  )}
                </div>

                {/* Hierarchical Path Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-[#6e7d73] dark:text-slate-400 flex-wrap pt-1">
                  {currentRec.pillar && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#faf8f4] dark:bg-slate-700 border border-[#e8e4db] dark:border-slate-600 font-bold text-[#3d4942] dark:text-slate-200">
                      <span className="text-xs">🏛️</span>
                      <span>{currentRec.pillar.title}</span>
                    </span>
                  )}

                  {currentRec.project && (
                    <>
                      <ChevronRight className="w-3 h-3 text-[#b5c2b9] dark:text-slate-500 rotate-180" />
                      <button
                        type="button"
                        onClick={() => onSelectProject && onSelectProject(currentRec.project!.id)}
                        className="inline-flex items-center gap-1 font-bold text-[#174235] dark:text-emerald-400 hover:underline cursor-pointer"
                        title="الانتقال للمشروع"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        <span>{currentRec.project.title}</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Reasons why this task is best */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-[#7a8a80] dark:text-slate-400">لماذا الآن؟</span>
                  {currentRec.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-[#2c4b3f] dark:text-emerald-300 bg-[#eef6f2] dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                    >
                      <span className="text-[#174235] dark:text-emerald-400 font-bold">✓</span>
                      <span>{reason}</span>
                    </span>
                  ))}
                </div>

              </div>

              {/* Action Buttons Section */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 justify-center">
                
                {/* 1. Start Focus Session */}
                <button
                  type="button"
                  onClick={() => onStartFocus(currentRec.task)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12362b] text-white rounded-xl text-xs font-black transition-all shadow-xs hover:shadow-md cursor-pointer group"
                >
                  <Play className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
                  <span>بدء العمل عليها الآن</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* 2. Complete Task Button */}
                  <button
                    type="button"
                    onClick={handleCompleteCurrent}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="تعليم المهمة كمنجزة بنقرة واحدة"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم الإنجاز</span>
                  </button>

                  {/* 3. Cycle Next Suggestion */}
                  {recommendations.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNextSuggestion}
                      className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-[#f3f0e8] text-[#4d5c52] dark:text-slate-300 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="اقتراح مهمة بديلة تناسب نفس المعايير"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>اقتراح آخر</span>
                    </button>
                  )}

                  {/* 4. Time Blocking shortcut */}
                  {onOpenTimeBlocking && (
                    <button
                      type="button"
                      onClick={onOpenTimeBlocking}
                      className="p-2 bg-white dark:bg-slate-800 hover:bg-[#f3f0e8] text-[#4d5c52] dark:text-slate-300 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="جدولتها في حجب الوقت"
                    >
                      <Calendar className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>
        ) : (
          /* Empty State: All tasks completed or filters too strict */
          <div className="bg-white dark:bg-slate-800 border border-[#e2ece5] dark:border-slate-700 rounded-2xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#ebf4ef] dark:bg-slate-700 text-[#174235] dark:text-emerald-400 mx-auto flex items-center justify-center text-xl shadow-2xs">
              🌿
            </div>
            <h3 className="text-sm font-black text-[#1a2420] dark:text-slate-100">
              أنت في القمة! لا توجد مهام معلقة تطابق هذه المعايير حالياً
            </h3>
            <p className="text-xs text-[#637269] dark:text-slate-400 max-w-md mx-auto">
              إما أنك أنجزت كافة مهام هذه الركيزة، أو يمكنك توسيع وقتك المتاح أو تغيير مستوى الطاقة لاستكشاف مهام أخرى.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPillarFilter('all');
                  setAvailableMinutes(60);
                  setEnergyLevel('medium');
                }}
                className="px-3 py-1.5 bg-[#f5f3ee] dark:bg-slate-700 hover:bg-[#ebe6dc] text-[#334239] dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#ded8cb] dark:border-slate-600"
              >
                إعادة ضبط الفلاتر
              </button>
              {onOpenTimeBlocking && (
                <button
                  type="button"
                  onClick={onOpenTimeBlocking}
                  className="px-3 py-1.5 bg-[#174235] dark:bg-emerald-700 hover:bg-[#12362b] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  عرض جدول كتل الوقت اليومي
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
