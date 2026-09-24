import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Zap, 
  Clock, 
  Battery, 
  BatteryMedium, 
  Rocket, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  ArrowUpRight, 
  Target, 
  Layers, 
  ChevronRight,
  HelpCircle,
  FolderKanban,
  User
} from 'lucide-react';
import { 
  Task, 
  Project, 
  StrategicGoal, 
  Vision, 
  Pillar, 
  TeamMember, 
  EnergyLevel, 
  RecommendedTaskResult 
} from '../types';
import { recommendBestTask } from '../utils/progressCalculator';
import { Avatar } from './Avatar';

interface SmartTaskRecommenderProps {
  tasks: Task[];
  projects: Project[];
  goals: StrategicGoal[];
  visions: Vision[];
  pillars: Pillar[];
  members: TeamMember[];
  onToggleTaskComplete: (taskId: string) => void;
  onSelectTask: (task: Task) => void;
}

export const SmartTaskRecommender: React.FC<SmartTaskRecommenderProps> = ({
  tasks,
  projects,
  goals,
  visions,
  pillars,
  members,
  onToggleTaskComplete,
  onSelectTask,
}) => {
  // Input settings for recommendation
  const [availableMinutes, setAvailableMinutes] = useState<number>(45);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Focus Timer state (25 minutes default Pomodoro)
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, secondsRemaining]);

  const startFocusTimer = (taskId: string, minutes: number = 25) => {
    setActiveTimerTaskId(taskId);
    setSecondsRemaining(minutes * 60);
    setTimerActive(true);
  };

  const toggleTimer = () => {
    setTimerActive((prev) => !prev);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setSecondsRemaining(25 * 60);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Run the recommendation engine
  const recommendations: RecommendedTaskResult[] = recommendBestTask(
    {
      availableMinutes,
      energyLevel,
      goalId: selectedGoalId,
      projectId: selectedProjectId,
    },
    tasks,
    projects,
    goals,
    visions,
    pillars
  );

  const bestTaskResult = recommendations.length > 0 ? recommendations[0] : null;
  const runnerUpTasks = recommendations.slice(1, 6);

  const getPriorityBadge = (score: number) => {
    if (score >= 85) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
          <span>🔥</span>
          <span>أولوية استراتيجية فائقة ({score}/100)</span>
        </span>
      );
    }
    if (score >= 65) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span>⚡</span>
          <span>أولوية عالية ({score}/100)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <span>🎯</span>
        <span>أولوية معتدلة ({score}/100)</span>
      </span>
    );
  };

  const getEnergyBadge = (level?: EnergyLevel) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>🚀</span>
            <span>تركيز عميق</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span>⚡</span>
            <span>طاقة متوسطة</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>🔋</span>
            <span>طاقة خفيفة</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Context Inputs */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-900">
                محرك التحديد الذكي: "أفضل مهمة أقوم بها الآن"
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              خوارزمية ذكية تحلل الوقت المتاح، مستوى طاقتك، الأهمية والاستعجال، والتوافق مع الهدف الأكبر لاقتراح المهمة المثالية للبدء فيها فوراً.
            </p>
          </div>

          {/* Focus Timer Mini Widget */}
          {timerActive && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 shrink-0 animate-pulse">
              <div>
                <span className="text-[10px] text-indigo-600 font-bold block">جلسة التركيز جارية:</span>
                <span className="font-mono text-lg font-bold text-indigo-900">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
              <button
                onClick={toggleTimer}
                className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
                title="إيقاف مؤقت"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetTimer}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded cursor-pointer"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Context Selector Controls */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Time Selector */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>الوقت المتاح لديك الآن:</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '15 د', mins: 15 },
                { label: '30 د', mins: 30 },
                { label: '45 د', mins: 45 },
                { label: '90 د+', mins: 90 },
              ].map((t) => (
                <button
                  key={t.mins}
                  onClick={() => setAvailableMinutes(t.mins)}
                  className={`py-1.5 px-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
                    availableMinutes === t.mins
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Energy & Focus Selector */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-500" />
              <span>مستوى طاقتك وتركيزك الحالي:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '🔋 خفيف', val: 'low' as EnergyLevel },
                { label: '⚡ متوسط', val: 'medium' as EnergyLevel },
                { label: '🚀 عميق', val: 'high' as EnergyLevel },
              ].map((e) => (
                <button
                  key={e.val}
                  onClick={() => setEnergyLevel(e.val)}
                  className={`py-1.5 px-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
                    energyLevel === e.val
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goal / Project Scope */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-500" />
              <span>نطاق الهدف الاستراتيجي أو المشروع:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs font-medium cursor-pointer"
              >
                <option value="all">كافة الأهداف الاستراتيجية</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs font-medium cursor-pointer"
              >
                <option value="all">كافة المشاريع</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Top Recommended Hero Card */}
      {bestTaskResult ? (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            
            {/* Top row: Recommendation badge & scores */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-indigo-900 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>الخيار الأفضل لك الآن</span>
                </span>
                <span className="text-xs font-mono text-indigo-200 bg-indigo-800/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
                  درجة التوافق: {bestTaskResult.fitScore}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getPriorityBadge(bestTaskResult.priorityScore)}
              </div>
            </div>

            {/* Strategic Cascade Lineage Trail */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-indigo-200/90 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-700/30">
              <span className="font-semibold text-indigo-300">السلسلة الاستراتيجية:</span>
              <span className="text-white font-medium">{bestTaskResult.pillar?.title || 'عام'}</span>
              <ChevronRight className="w-3 h-3 text-indigo-400 rotate-180" />
              <span className="text-white font-medium">{bestTaskResult.vision?.title.slice(0, 24) || 'رؤية'}...</span>
              <ChevronRight className="w-3 h-3 text-indigo-400 rotate-180" />
              <span className="text-white font-medium">{bestTaskResult.goal?.title.slice(0, 24) || 'هدف'}...</span>
              <ChevronRight className="w-3 h-3 text-indigo-400 rotate-180" />
              <span className="text-emerald-300 font-bold">{bestTaskResult.project?.name || ''}</span>
            </div>

            {/* Main Task Title & Description */}
            <div>
              <h3 
                onClick={() => onSelectTask(bestTaskResult.task)}
                className="text-lg sm:text-xl font-bold text-white hover:text-indigo-200 transition-colors cursor-pointer"
              >
                {bestTaskResult.task.title}
              </h3>
              <p className="text-xs text-indigo-100/80 mt-1 line-clamp-2">
                {bestTaskResult.task.description}
              </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 border border-white/10">
                <span className="text-[10px] text-indigo-200 block">التأثير الاستراتيجي:</span>
                <span className="font-mono text-base font-bold text-white">
                  {bestTaskResult.task.impactScore || 5} / 10
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 border border-white/10">
                <span className="text-[10px] text-indigo-200 block">القيمة الناتجة:</span>
                <span className="font-mono text-base font-bold text-white">
                  {bestTaskResult.task.valueScore || 5} / 10
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 border border-white/10">
                <span className="text-[10px] text-indigo-200 block">الطاقة المطلوبة:</span>
                <span className="text-xs font-bold text-white mt-1 block">
                  {bestTaskResult.task.energyLevel === 'high' ? '🚀 تركيز عميق' : bestTaskResult.task.energyLevel === 'medium' ? '⚡ طاقة متوسطة' : '🔋 طاقة خفيفة'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2.5 border border-white/10">
                <span className="text-[10px] text-indigo-200 block">الوقت التقديري:</span>
                <span className="font-mono text-base font-bold text-white">
                  {bestTaskResult.task.estimatedHours || 1} ساعة
                </span>
              </div>
            </div>

            {/* Reasoning Box */}
            <div className="bg-indigo-950/60 border border-indigo-600/30 rounded-lg p-3 text-xs flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-indigo-100 leading-relaxed">
                <span className="font-bold text-amber-300">لماذا رشح النظام هذه المهمة لك الآن؟ </span>
                {bestTaskResult.reason}
              </div>
            </div>

            {/* Dependency Warning if any */}
            {bestTaskResult.isBlocked && (
              <div className="bg-rose-950/80 border border-rose-600/50 rounded-lg p-3 text-xs flex items-center gap-2 text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  تنبيه اعتمادية: هذه المهمة معطلة حتى إنجاز: {bestTaskResult.blockingTasks.map((b) => b.title).join('، ')}
                </span>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => startFocusTimer(bestTaskResult.task.id, Math.min(60, (bestTaskResult.task.estimatedHours || 1) * 30))}
                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-md font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>بدء جلسة تركيز</span>
              </button>

              <button
                onClick={() => onToggleTaskComplete(bestTaskResult.task.id)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>إتمام المهمة الآن بنقرة واحدة</span>
              </button>

              <button
                onClick={() => onSelectTask(bestTaskResult.task)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                <span>عرض التفاصيل الكاملة</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500 text-xs">
          جميع المهام المطابقة للمعايير مكتملة! أحسنت عملاً.
        </div>
      )}

      {/* 3. Alternative Ranked Tasks Queue (المقترحات البديلة التالية) */}
      {runnerUpTasks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>قائمة المهام التالية بالترتيب الاستراتيجي</span>
            </h3>
            <span className="text-xs text-slate-500">
              مرتبة حسب ناتج (الأثر + القيمة + الاستعجال + التوافق مع الهدف الأكبر)
            </span>
          </div>

          <div className="space-y-2.5">
            {runnerUpTasks.map((item, idx) => {
              const assignee = members.find((m) => m.id === item.task.assigneeId);

              return (
                <div
                  key={item.task.id}
                  className="p-3 bg-slate-50/60 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Rank number & Task title */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                      #{idx + 2}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => onSelectTask(item.task)}
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                        >
                          {item.task.title}
                        </span>
                        {item.isBlocked && (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
                            معلقة
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        {item.project?.name} • {item.reason}
                      </span>
                    </div>
                  </div>

                  {/* Strategic Attributes & Action */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    {getEnergyBadge(item.task.energyLevel)}
                    
                    <span 
                      title="مقياس الأثر الاستراتيجي"
                      className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"
                    >
                      أثر {item.task.impactScore || 5}/10
                    </span>

                    <span 
                      title="درجة الأولوية الذكية المركبة"
                      className="font-mono text-[10px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold"
                    >
                      نقاط {item.priorityScore}
                    </span>

                    {assignee && (
                      <Avatar
                        name={assignee.name}
                        avatar={assignee.avatar}
                        size="xs"
                        title={assignee.name}
                      />
                    )}

                    <button
                      onClick={() => onToggleTaskComplete(item.task.id)}
                      title="إتمام فوري"
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
