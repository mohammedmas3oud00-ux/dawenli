import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Zap, 
  Clock, 
  Coffee, 
  BatteryMedium, 
  CheckCircle2, 
  Play, 
  RotateCw, 
  Calendar, 
  Layers, 
  Folder, 
  AlertCircle,
  Flame,
  ChevronRight,
  ArrowLeft
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
    <div className="bg-linear-to-br from-[#fbfaf7] to-[#f4f7f4] border border-[#dce6e0] rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all">
      
      {/* Subtle decorative background watermarks */}
      <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-48 h-48 bg-[#174235]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-10 translate-y-10 w-44 h-44 bg-[#d1a153]/10 rounded-full blur-xl pointer-events-none" />

      {/* Top Bar: Header & Interactive Filters */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5ece7]">
        
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#174235] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-[#f5d77f]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#174235]">
                أفضل مهمة للقيام بها الآن (Next Best Action)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#174235]/10 text-[#174235] border border-[#174235]/20 text-center">
                خوارزمية المواءمة الذكية
              </span>
            </div>
            <p className="text-xs text-[#526359] mt-0.5">
              اقتراح فوري مستند إلى وقتك المتاح، طاقتك الحالية، مواعيد الاستحقاق، والأولويات الاستراتيجية.
            </p>
          </div>
        </div>

        {/* Energy & Time Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Available Minutes Selector */}
          <div className="flex items-center bg-white border border-[#d6dfd9] rounded-xl p-0.5 shadow-2xs">
            <span className="text-[11px] text-[#718278] font-bold px-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#174235]" />
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
                    ? 'bg-[#174235] text-white shadow-2xs'
                    : 'text-[#526359] hover:bg-[#f0f4f1]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Energy Level Selector */}
          <div className="flex items-center bg-white border border-[#d6dfd9] rounded-xl p-0.5 shadow-2xs">
            <span className="text-[11px] text-[#718278] font-bold px-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#d97706]" />
              <span>الطاقة:</span>
            </span>
            {[
              { val: 'high', label: 'عالية', icon: '⚡', color: 'text-amber-700' },
              { val: 'medium', label: 'معتدلة', icon: '🔋', color: 'text-emerald-700' },
              { val: 'low', label: 'هادئة', icon: '☕', color: 'text-stone-700' },
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
                    ? 'bg-[#174235] text-white shadow-2xs'
                    : 'text-[#526359] hover:bg-[#f0f4f1]'
                }`}
              >
                <span>{e.icon}</span>
                <span>{e.label}</span>
              </button>
            ))}
          </div>

          {/* Pillar Filter (Optional dropdown) */}
          {pillars.length > 0 && (
            <div className="w-40 hidden sm:block">
              <CustomSelect
                value={selectedPillarFilter}
                onChange={(val) => {
                  setSelectedPillarFilter(val);
                  setCurrentIndex(0);
                }}
                options={[
                  { value: 'all', label: 'كافة الركائز' },
                  ...pillars.map((p) => ({ value: p.id, label: p.title })),
                ]}
                prefixIcon={<Layers className="w-3.5 h-3.5 text-[#174235]" />}
                size="xs"
                buttonClassName="py-1 px-2.5 text-xs rounded-xl"
              />
            </div>
          )}

        </div>
      </div>

      {/* Main Spotlight Body */}
      <div className="relative z-10 pt-4">
        {currentRec ? (
          <div className={`transition-all duration-300 ${isCompletedAnim ? 'opacity-30 scale-98 blur-2xs' : 'opacity-100 scale-100'}`}>
            <div className="bg-white border border-[#cfe0d5] rounded-2xl p-5 shadow-sm hover:border-[#174235]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5">
              
              {/* Task Details Section */}
              <div className="space-y-3 flex-1 min-w-0">
                
                {/* Score & Badges Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ebf5ef] border border-[#b9dbcb] text-[#174235] font-black text-xs shadow-2xs">
                    <Flame className="w-3.5 h-3.5 text-[#e67e22]" />
                    <span>درجة المواءمة: {currentRec.score}%</span>
                  </div>

                  {/* Urgency Badge */}
                  <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    currentRec.urgencyLabel.includes('متأخرة') 
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : currentRec.urgencyLabel.includes('اليوم')
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    <AlertCircle className="w-3 h-3" />
                    <span>{currentRec.urgencyLabel}</span>
                  </div>

                  {/* Time & Energy Estimate */}
                  <span className="text-[11px] font-bold text-[#627369] bg-[#f5f3ee] px-2.5 py-0.5 rounded-md border border-[#e4dfd5] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#174235]" />
                    <span>~{currentRec.estimatedMinutes} دقيقة</span>
                  </span>

                  <span className="text-[11px] font-bold text-[#627369] bg-[#f5f3ee] px-2.5 py-0.5 rounded-md border border-[#e4dfd5] flex items-center gap-1">
                    <span>{currentRec.requiredEnergy === 'high' ? '⚡ طاقة تركيز' : currentRec.requiredEnergy === 'medium' ? '🔋 طاقة معتدلة' : '☕ روتينية'}</span>
                  </span>

                  {recommendations.length > 1 && (
                    <span className="text-[11px] text-[#86968c] font-medium mr-auto">
                      المقترح {currentIndex + 1} من {recommendations.length}
                    </span>
                  )}
                </div>

                {/* Task Title */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1a2420] tracking-tight leading-snug">
                    {currentRec.task.title}
                  </h3>
                  {currentRec.task.description && (
                    <p className="text-xs text-[#526359] mt-1 line-clamp-2 leading-relaxed">
                      {currentRec.task.description}
                    </p>
                  )}
                </div>

                {/* Hierarchical Path Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-[#6e7d73] flex-wrap pt-1">
                  {currentRec.pillar && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#faf8f4] border border-[#e8e4db] font-bold text-[#3d4942]">
                      <span className="text-xs">🏛️</span>
                      <span>{currentRec.pillar.title}</span>
                    </span>
                  )}

                  {currentRec.project && (
                    <>
                      <ChevronRight className="w-3 h-3 text-[#b5c2b9] rotate-180" />
                      <button
                        type="button"
                        onClick={() => onSelectProject && onSelectProject(currentRec.project!.id)}
                        className="inline-flex items-center gap-1 font-bold text-[#174235] hover:underline cursor-pointer"
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
                  <span className="text-[11px] font-bold text-[#7a8a80]">لماذا الآن؟</span>
                  {currentRec.reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-[#2c4b3f] bg-[#eef6f2] px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                    >
                      <span className="text-[#174235]">✓</span>
                      <span>{reason}</span>
                    </span>
                  ))}
                </div>

              </div>

              {/* Action Buttons Section */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 justify-center">
                
                {/* 1. Start Focus Session (Pomodoro / Flowtime) */}
                <button
                  type="button"
                  onClick={() => onStartFocus(currentRec.task)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#174235] hover:bg-[#12362b] text-white rounded-xl text-xs font-black transition-all shadow-xs hover:shadow-md cursor-pointer group"
                >
                  <Play className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
                  <span>ابدأ العمل عليها الآن (Focus)</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* 2. Complete Task Button */}
                  <button
                    type="button"
                    onClick={handleCompleteCurrent}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                      className="px-3 py-2 bg-white hover:bg-[#f3f0e8] text-[#4d5c52] border border-[#d8d4cc] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
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
                      className="p-2 bg-white hover:bg-[#f3f0e8] text-[#4d5c52] border border-[#d8d4cc] rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="جدولتها في كتل الوقت (Time Blocking)"
                    >
                      <Calendar className="w-4 h-4 text-[#174235]" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>
        ) : (
          /* Empty State: All tasks completed or filters too strict */
          <div className="bg-white border border-[#e2ece5] rounded-2xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#ebf4ef] text-[#174235] mx-auto flex items-center justify-center text-xl shadow-2xs">
              🌿
            </div>
            <h3 className="text-sm font-black text-[#1a2420]">
              أنت في القمة! لا توجد مهام معلقة تطابق هذه المعايير حالياً
            </h3>
            <p className="text-xs text-[#637269] max-w-md mx-auto">
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
                className="px-3 py-1.5 bg-[#f5f3ee] hover:bg-[#ebe6dc] text-[#334239] rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#ded8cb]"
              >
                إعادة ضبط الفلاتر
              </button>
              {onOpenTimeBlocking && (
                <button
                  type="button"
                  onClick={onOpenTimeBlocking}
                  className="px-3 py-1.5 bg-[#174235] hover:bg-[#12362b] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
