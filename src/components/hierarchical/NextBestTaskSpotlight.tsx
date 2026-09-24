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
import { CustomSelect } from './CustomSelect';

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
  const [availableMinutes, setAvailableMinutes] = useState<number>(45);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('high');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isCompletedAnim, setIsCompletedAnim] = useState<boolean>(false);

  const recommendations = useMemo(() => {
    return getRecommendedTasks(tasks, projects, goals, pillars, {
      availableMinutes,
      energyLevel,
      pillarId: selectedPillarFilter,
    });
  }, [tasks, projects, goals, pillars, availableMinutes, energyLevel, selectedPillarFilter]);

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
    <section
      aria-label="أفضل خطوة تالية مقترحة"
      className="bg-linear-to-br from-[#fbfaf7] to-[#f4f7f4] dark:from-[#131d18] dark:to-[#17261f] border border-[#dce6e0] dark:border-[#223329] rounded-2xl p-5 sm:p-6 shadow-xs relative transition-colors"
    >
      {/* Top Bar: Header & Interactive Filters */}
      <div className="relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e5ece7] dark:border-[#223329]">
        
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#174235] dark:bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0" aria-hidden="true">
            <Sparkles className="w-5 h-5 text-[#f5d77f]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#174235] dark:text-emerald-400">
                أفضل مهمة للبدء بها الآن
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#174235]/10 dark:bg-emerald-400/10 text-[#174235] dark:text-emerald-300 border border-[#174235]/20 dark:border-emerald-500/20">
                ترشيح ذكي
              </span>
            </div>
            <p className="text-xs text-[#526359] dark:text-[#9bb0a3] mt-0.5">
              ترشيح فوري وفقاً للوقت المتاح لديك ومستوى طاقتك الحالي والأولويات.
            </p>
          </div>
        </div>

        {/* Energy, Time, and Pillar Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Available Minutes Selector */}
          <div className="flex items-center bg-white dark:bg-[#1a2620] border border-[#d6dfd9] dark:border-[#283d31] rounded-xl p-0.5 shadow-2xs">
            <span className="text-[11px] text-[#718278] dark:text-[#9bb0a3] font-bold px-2 flex items-center gap-1">
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                  availableMinutes === t.val
                    ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#526359] dark:text-[#a2b3aa] hover:bg-[#f0f4f1] dark:hover:bg-[#22362b]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Energy Level Selector */}
          <div className="flex items-center bg-white dark:bg-[#1a2620] border border-[#d6dfd9] dark:border-[#283d31] rounded-xl p-0.5 shadow-2xs">
            <span className="text-[11px] text-[#718278] dark:text-[#9bb0a3] font-bold px-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
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
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                  energyLevel === e.val
                    ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#526359] dark:text-[#a2b3aa] hover:bg-[#f0f4f1] dark:hover:bg-[#22362b]'
                }`}
              >
                <span>{e.icon}</span>
                <span>{e.label}</span>
              </button>
            ))}
          </div>

          {/* Pillar Filter (Visible and prominent on all screen sizes) */}
          {pillars.length > 0 && (
            <div className="min-w-[130px] sm:w-44 grow sm:grow-0">
              <CustomSelect
                value={selectedPillarFilter}
                onChange={(val) => {
                  setSelectedPillarFilter(val);
                  setCurrentIndex(0);
                }}
                options={[
                  { value: 'all', label: 'كافة المجالات' },
                  ...pillars.map((p) => ({ value: p.id, label: p.title })),
                ]}
                prefixIcon={<Layers className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />}
                size="sm"
                buttonClassName="py-1 px-2.5 text-xs rounded-xl shadow-2xs bg-white dark:bg-[#1a2620] border-[#d6dfd9] dark:border-[#283d31]"
              />
            </div>
          )}

        </div>
      </div>

      {/* Main Spotlight Body */}
      <div className="relative z-10 pt-4">
        {currentRec ? (
          <div className={`transition-all duration-300 ${isCompletedAnim ? 'opacity-30 scale-98 blur-2xs' : 'opacity-100 scale-100'}`}>
            <div className="bg-white dark:bg-[#16201b] border border-[#cfe0d5] dark:border-[#24372d] rounded-2xl p-5 shadow-xs hover:border-[#174235]/40 dark:hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5">
              
              {/* Task Details Section */}
              <div className="space-y-3 flex-1 min-w-0">
                
                {/* Score & Unboxed Metadata Separators */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ebf5ef] dark:bg-[#192b22] border border-[#b9dbcb] dark:border-[#274534] text-[#174235] dark:text-emerald-300 font-black shadow-2xs">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>مواءمة: {currentRec.score}%</span>
                  </div>

                  <span className="text-[#a2b3aa] dark:text-[#415549]" aria-hidden="true">·</span>

                  {/* Urgency Text */}
                  <span className={`font-semibold ${
                    currentRec.urgencyLabel.includes('متأخرة') 
                      ? 'text-rose-600 dark:text-rose-400'
                      : currentRec.urgencyLabel.includes('اليوم')
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {currentRec.urgencyLabel}
                  </span>

                  <span className="text-[#a2b3aa] dark:text-[#415549]" aria-hidden="true">·</span>

                  {/* Time & Energy Estimate */}
                  <span className="text-[#596960] dark:text-[#9bb0a3] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
                    <span>~{currentRec.estimatedMinutes} دقيقة</span>
                  </span>

                  <span className="text-[#a2b3aa] dark:text-[#415549]" aria-hidden="true">·</span>

                  <span className="text-[#596960] dark:text-[#9bb0a3]">
                    {currentRec.requiredEnergy === 'high' ? '⚡ تركيز عالي' : currentRec.requiredEnergy === 'medium' ? '🔋 جهد معتدل' : '☕ روتينية خفيفة'}
                  </span>

                  {recommendations.length > 1 && (
                    <span className="text-[11px] text-[#86968c] dark:text-[#718579] font-medium mr-auto">
                      المقترح {currentIndex + 1} من {recommendations.length}
                    </span>
                  )}
                </div>

                {/* Task Title */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1a2420] dark:text-white tracking-tight leading-snug">
                    {currentRec.task.title}
                  </h3>
                  {currentRec.task.description && (
                    <p className="text-xs text-[#526359] dark:text-[#9bb0a3] mt-1 line-clamp-2 leading-relaxed">
                      {currentRec.task.description}
                    </p>
                  )}
                </div>

                {/* Hierarchical Path Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-[#6e7d73] dark:text-[#9bb0a3] flex-wrap pt-1">
                  {currentRec.pillar && (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#3d4942] dark:text-[#c4d6cb]">
                      <span className="text-xs" aria-hidden="true">🌱</span>
                      <span>{currentRec.pillar.title}</span>
                    </span>
                  )}

                  {currentRec.project && (
                    <>
                      <ChevronRight className="w-3 h-3 text-[#b5c2b9] dark:text-[#415549] rotate-180" aria-hidden="true" />
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
                  <span className="text-[11px] font-bold text-[#7a8a80] dark:text-[#8ea095]">لماذا هذه المهمة الآن؟</span>
                  {currentRec.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-[#2c4b3f] dark:text-emerald-300 bg-[#eef6f2] dark:bg-[#1a2d23] px-2 py-0.5 rounded-lg font-medium flex items-center gap-1"
                    >
                      <span className="text-[#174235] dark:text-emerald-400">✓</span>
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
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer group focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#174235] dark:focus-visible:ring-emerald-400 focus-visible:outline-hidden"
                >
                  <Play className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
                  <span>بدء جلسة تركيز</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* 2. Complete Task Button */}
                  <button
                    type="button"
                    onClick={handleCompleteCurrent}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="تعليم المهمة كمنجزة"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم الإنجاز</span>
                  </button>

                  {/* 3. Cycle Next Suggestion */}
                  {recommendations.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNextSuggestion}
                      className="px-3 py-2 bg-white dark:bg-[#1a2620] hover:bg-[#f3f0e8] dark:hover:bg-[#22332a] text-[#4d5c52] dark:text-[#c4d6cb] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
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
                      aria-label="جدولة المهمة في الجدول اليومي"
                      className="p-2 bg-white dark:bg-[#1a2620] hover:bg-[#f3f0e8] dark:hover:bg-[#22332a] text-[#4d5c52] dark:text-[#c4d6cb] border border-[#d8d4cc] dark:border-[#283d31] rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="جدولة المهمة في الجدول اليومي"
                    >
                      <Calendar className="w-4 h-4 text-[#174235] dark:text-emerald-400" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-[#16201b] border border-[#e2ece5] dark:border-[#24372d] rounded-2xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#ebf4ef] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 mx-auto flex items-center justify-center text-xl shadow-2xs">
              🌿
            </div>
            <h3 className="text-sm font-black text-[#1a2420] dark:text-white">
              أنت في القمة! لا توجد مهام معلقة تطابق هذه المعايير حالياً
            </h3>
            <p className="text-xs text-[#637269] dark:text-[#9bb0a3] max-w-md mx-auto">
              إما أنك أنجزت كافة مهام هذا المجال، أو يمكنك توسيع وقتك المتاح أو تغيير مستوى الطاقة.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPillarFilter('all');
                  setAvailableMinutes(60);
                  setEnergyLevel('medium');
                }}
                className="px-3 py-1.5 bg-[#f5f3ee] dark:bg-[#1a2620] hover:bg-[#ebe6dc] dark:hover:bg-[#22332a] text-[#334239] dark:text-[#c4d6cb] rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#ded8cb] dark:border-[#283d31]"
              >
                إعادة ضبط الفلاتر
              </button>
              {onOpenTimeBlocking && (
                <button
                  type="button"
                  onClick={onOpenTimeBlocking}
                  className="px-3 py-1.5 bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  عرض الجدول اليومي
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </section>
  );
};
