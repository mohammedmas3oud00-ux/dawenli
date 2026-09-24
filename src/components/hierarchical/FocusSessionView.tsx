import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Waves, 
  Flame, 
  Coffee, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  Clock,
  Zap,
  Calendar,
  BarChart2,
  Target
} from 'lucide-react';
import { Task, Project, Pillar, FocusMode, FocusSessionRecord } from '../../types/hierarchical';
import { CustomSelect } from './CustomSelect';
import { playFocusSound } from '../../utils/audioChime';

interface FocusSessionViewProps {
  tasks: Task[];
  projects: Project[];
  pillars: Pillar[];
  initialTask?: Task | null;
  onToggleTaskStatus: (taskId: string) => void;
  onSaveSession: (session: FocusSessionRecord) => void;
  sessionsHistory: FocusSessionRecord[];
  onOpenTimeBlocking?: () => void;
  onBackToHierarchy?: () => void;
}

type PomodoroPhase = 'work' | 'short_break' | 'long_break';

export const FocusSessionView: React.FC<FocusSessionViewProps> = ({
  tasks,
  projects,
  pillars,
  initialTask,
  onToggleTaskStatus,
  onSaveSession,
  sessionsHistory,
  onOpenTimeBlocking,
  onBackToHierarchy,
}) => {
  // Mode: Pomodoro vs Flowtime
  const [mode, setMode] = useState<FocusMode>('pomodoro');

  // Selected Task
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTask?.id || '');
  const [customIntention, setCustomIntention] = useState<string>('');

  // Pomodoro Configuration
  const [workDurationMinutes] = useState<number>(25);
  const [shortBreakMinutes] = useState<number>(5);
  const [longBreakMinutes] = useState<number>(15);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');

  // Timer State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60); // Pomodoro countdown
  const [flowSeconds, setFlowSeconds] = useState<number>(0); // Flowtime count-up
  const [isInBreak, setIsInBreak] = useState<boolean>(false); // Flowtime break mode
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState<number>(0);

  // Distraction & session metrics
  const [distractionsCount, setDistractionsCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedPomodorosCount, setCompletedPomodorosCount] = useState<number>(0);

  // Suggested flow break display
  const [suggestedBreakNotice, setSuggestedBreakNotice] = useState<string | null>(null);

  const activeTask = tasks.find(t => t.id === selectedTaskId) || initialTask;
  const activeProject = activeTask ? projects.find(p => p.id === activeTask.project_id) : undefined;
  const activePillar = activeProject ? pillars.find(p => p.id === (activeProject as any).pillar_id) : undefined;

  // Active tasks options for custom select
  const activeTasksList = tasks.filter(t => t.status !== 'done');
  const taskOptions = [
    { value: '', label: '🎯 نية تركيز حرة (بدون مهمة مسجلة)' },
    ...activeTasksList.map(t => ({
      value: t.id,
      label: `${t.title} ${t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'}`,
    })),
  ];

  // If initialTask changes from outside, adopt it
  useEffect(() => {
    if (initialTask && initialTask.id !== selectedTaskId) {
      setSelectedTaskId(initialTask.id);
    }
  }, [initialTask]);

  // Pomodoro Phase change handler
  const switchPomodoroPhase = (phase: PomodoroPhase) => {
    setIsActive(false);
    setPomodoroPhase(phase);
    if (phase === 'work') {
      setSecondsRemaining(workDurationMinutes * 60);
    } else if (phase === 'short_break') {
      setSecondsRemaining(shortBreakMinutes * 60);
    } else {
      setSecondsRemaining(longBreakMinutes * 60);
    }
  };

  // Log session to store
  const logCurrentSession = (durationSec: number, sessionMode: FocusMode) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecord: FocusSessionRecord = {
      id: `fs-${Date.now()}`,
      task_id: activeTask?.id || null,
      task_title: activeTask ? activeTask.title : customIntention || 'جلسة تركيز حر',
      project_title: activeProject?.title,
      pillar_title: activePillar?.title,
      mode: sessionMode,
      duration_seconds: durationSec,
      date: today,
      completed_at: new Date().toISOString(),
      distractions_count: distractionsCount,
    };
    onSaveSession(newRecord);
    setDistractionsCount(0);
  };

  // Timer Tick Effect
  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      if (mode === 'pomodoro') {
        // Countdown
        if (secondsRemaining > 0) {
          interval = setInterval(() => {
            setSecondsRemaining((prev) => prev - 1);
          }, 1000);
        } else {
          // Finished Pomodoro phase!
          setIsActive(false);
          if (soundEnabled) playFocusSound(pomodoroPhase === 'work' ? 'complete' : 'break');

          if (pomodoroPhase === 'work') {
            const nextPomodoroCount = completedPomodorosCount + 1;
            setCompletedPomodorosCount(nextPomodoroCount);

            // Save session record
            logCurrentSession(workDurationMinutes * 60, 'pomodoro');

            // Suggest short or long break
            if (nextPomodoroCount % 4 === 0) {
              switchPomodoroPhase('long_break');
            } else {
              switchPomodoroPhase('short_break');
            }
          } else {
            // Break finished, ready to work again
            switchPomodoroPhase('work');
          }
        }
      } else {
        // Flowtime Mode: Count-up if working, count-down if in break
        if (!isInBreak) {
          interval = setInterval(() => {
            setFlowSeconds((prev) => prev + 1);
          }, 1000);
        } else {
          if (breakSecondsRemaining > 0) {
            interval = setInterval(() => {
              setBreakSecondsRemaining((prev) => prev - 1);
            }, 1000);
          } else {
            setIsActive(false);
            setIsInBreak(false);
            setSuggestedBreakNotice(null);
            if (soundEnabled) playFocusSound('break');
          }
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, flowSeconds, isInBreak, breakSecondsRemaining, mode, pomodoroPhase, workDurationMinutes, shortBreakMinutes, longBreakMinutes, completedPomodorosCount, soundEnabled]);

  // Flowtime: Stop flow and calculate break
  const handleFlowtimeBreak = () => {
    if (flowSeconds < 60) return;

    setIsActive(false);
    const flowMinutes = Math.floor(flowSeconds / 60);

    let suggestedBreak = 5;
    if (flowMinutes >= 90) suggestedBreak = 25;
    else if (flowMinutes >= 50) suggestedBreak = 15;
    else if (flowMinutes >= 25) suggestedBreak = 8;

    logCurrentSession(flowSeconds, 'flowtime');

    setSuggestedBreakNotice(`تدفق رائع! ركّزت لمدة ${flowMinutes} دقيقة متواصلة. الاستراحة المقترحة هي ${suggestedBreak} دقائق.`);
    setBreakSecondsRemaining(suggestedBreak * 60);
    setIsInBreak(true);
    setFlowSeconds(0);
    if (soundEnabled) playFocusSound('complete');
  };

  const handleToggleTimer = () => {
    if (!isActive && soundEnabled) {
      playFocusSound('start');
    }
    setIsActive((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    if (mode === 'pomodoro') {
      switchPomodoroPhase(pomodoroPhase);
    } else {
      setFlowSeconds(0);
      setIsInBreak(false);
      setBreakSecondsRemaining(0);
      setSuggestedBreakNotice(null);
    }
  };

  const handleCompleteCurrentTask = () => {
    if (!activeTask) return;
    onToggleTaskStatus(activeTask.id);
    if (isActive) {
      if (mode === 'pomodoro') {
        logCurrentSession(workDurationMinutes * 60 - secondsRemaining, 'pomodoro');
      } else {
        logCurrentSession(flowSeconds, 'flowtime');
      }
      setIsActive(false);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Analytics for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessionsHistory.filter(s => s.date === todayStr);
  const totalFocusMinutesToday = Math.round(
    todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* 1. Header & Mode Switcher */}
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-5 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[#1a2420] dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400">
                <Clock className="w-5 h-5" />
              </span>
              <span>غرفة التركيز العميق (Focus Space)</span>
            </h1>
            <p className="text-xs text-[#6e7d73] dark:text-[#9bb0a3] mt-1">
              اختر وضع التركيز المناسب لطبيعة مهمتك، وادخل في حالة الاستغراق الذهني الكامل.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-[#ebf4f0] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 border-[#cfe3d9] dark:border-[#2d4034]' 
                  : 'bg-[#faf8f4] dark:bg-[#18261e] text-[#86968c] dark:text-[#6a7c71] border-[#e8e4db] dark:border-[#26372d]'
              }`}
              title={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
              aria-label={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onOpenTimeBlocking && (
              <button
                type="button"
                onClick={onOpenTimeBlocking}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#18261e] hover:bg-[#f6f5f1] dark:hover:bg-[#203228] text-[#3a443f] dark:text-[#b4c7bd] border border-[#e3dfd7] dark:border-[#283830] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
                <span>جدول حجب الوقت</span>
              </button>
            )}

            {onBackToHierarchy && (
              <button
                type="button"
                onClick={onBackToHierarchy}
                className="flex items-center gap-1 px-3 py-2 bg-[#f4f2ed] dark:bg-[#1c2a22] hover:bg-[#ebe7df] dark:hover:bg-[#23352b] text-[#334239] dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <span>العودة للمنظومة</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#f0eee9] dark:border-[#223028]">
          <button
            type="button"
            onClick={() => {
              setIsActive(false);
              setMode('pomodoro');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'pomodoro'
                ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-xs'
                : 'bg-[#f4f2ed] dark:bg-[#192620] text-[#55645b] dark:text-[#9bb0a3] hover:bg-[#eae6dd] dark:hover:bg-[#203026]'
            }`}
          >
            <span>🍅</span>
            <span>بومودورو (Pomodoro)</span>
            <span className="text-[10px] opacity-80 font-normal">فترات تنازلية محددة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActive(false);
              setMode('flowtime');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'flowtime'
                ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-xs'
                : 'bg-[#f4f2ed] dark:bg-[#192620] text-[#55645b] dark:text-[#9bb0a3] hover:bg-[#eae6dd] dark:hover:bg-[#203026]'
            }`}
          >
            <Waves className="w-4 h-4 text-cyan-400" />
            <span>تقنية التدفق الحر (Flowtime)</span>
            <span className="text-[10px] opacity-80 font-normal">عداد تصاعدي بلا مقاطعة</span>
          </button>
        </div>
      </div>

      {/* 2. Main Focus Stage Card */}
      <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-3xl p-6 sm:p-10 shadow-sm text-center relative overflow-hidden transition-colors">
        
        {/* Subtle decorative glow when active */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isActive 
            ? (mode === 'pomodoro' && pomodoroPhase !== 'work') || isInBreak
              ? 'bg-amber-400/10'
              : 'bg-emerald-500/15 scale-110'
            : 'bg-transparent'
        }`} />

        {/* Task Selection Section */}
        <div className="max-w-xl mx-auto space-y-3 relative z-10">
          <label className="block text-xs font-bold text-[#55645b] dark:text-[#9bb0a3]">
            المهمة المراد التركيز عليها الآن:
          </label>

          <div className="relative">
            <CustomSelect
              value={selectedTaskId}
              onChange={(val) => {
                setSelectedTaskId(val);
                if (val) setCustomIntention('');
              }}
              options={taskOptions}
              prefixIcon={<Target className="w-4 h-4 text-[#174235] dark:text-emerald-400" />}
              className="w-full text-right"
              buttonClassName="w-full py-2.5 px-3.5 text-xs font-bold rounded-xl border border-[#d8d4cc] dark:border-[#2d4034] bg-[#faf8f5] dark:bg-[#18261e]"
              dropdownClassName="w-full max-h-60"
            />
          </div>

          {!selectedTaskId && (
            <input
              type="text"
              value={customIntention}
              onChange={(e) => setCustomIntention(e.target.value)}
              placeholder="اكتب نية التركيز لجلسة اليوم (مثلاً: إنهاء مراجعة الكود، قراءة 20 صفحة)..."
              className="w-full px-3.5 py-2 border border-[#d8d4cc] dark:border-[#2d4034] rounded-xl text-xs bg-[#faf8f5] dark:bg-[#18261e] text-[#1a2420] dark:text-white outline-hidden focus:border-[#174235] dark:focus:border-emerald-500 transition-all"
            />
          )}

          {/* Active Task Breadcrumb context if linked */}
          {activeTask && (
            <div className="flex items-center justify-center gap-2 text-xs text-[#6e7d73] dark:text-[#8ea095] pt-1">
              {activePillar && (
                <span className="font-bold text-[#1a2420] dark:text-white">🏛️ {activePillar.title}</span>
              )}
              {activeProject && (
                <>
                  <span className="text-[#c2bcaf] dark:text-[#384a3e]">/</span>
                  <span className="font-semibold text-[#174235] dark:text-emerald-400">📁 {activeProject.title}</span>
                </>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTask.priority === 'high' 
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400' 
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
              }`}>
                {activeTask.priority === 'high' ? 'أولوية عالية' : 'أولوية متوسطة'}
              </span>
            </div>
          )}
        </div>

        {/* Mode Specific Controls & Display */}
        {mode === 'pomodoro' ? (
          <div className="mt-8 space-y-6 relative z-10">
            
            {/* Pomodoro Phase Selector */}
            <div className="inline-flex items-center bg-[#f4f2ed] dark:bg-[#192620] p-1 rounded-2xl border border-[#e4e0d6] dark:border-[#26372d] gap-1">
              <button
                type="button"
                onClick={() => switchPomodoroPhase('work')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pomodoroPhase === 'work'
                    ? 'bg-[#174235] dark:bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#637269] dark:text-[#8ea095] hover:text-[#174235] dark:hover:text-white'
                }`}
              >
                <span>🧠</span>
                <span>تركيز ({workDurationMinutes}د)</span>
              </button>

              <button
                type="button"
                onClick={() => switchPomodoroPhase('short_break')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pomodoroPhase === 'short_break'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'text-[#637269] dark:text-[#8ea095] hover:text-amber-800 dark:hover:text-amber-400'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>راحة قصيرة ({shortBreakMinutes}د)</span>
              </button>

              <button
                type="button"
                onClick={() => switchPomodoroPhase('long_break')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pomodoroPhase === 'long_break'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'text-[#637269] dark:text-[#8ea095] hover:text-sky-800 dark:hover:text-sky-400'
                }`}
              >
                <span>🌴</span>
                <span>راحة طويلة ({longBreakMinutes}د)</span>
              </button>
            </div>

            {/* Giant Digital Countdown Display */}
            <div className="py-4 select-none">
              <div className="text-6xl sm:text-8xl font-black tracking-tight text-[#1a2420] dark:text-white font-mono tabular-nums">
                {formatTime(secondsRemaining)}
              </div>
              <p className="text-xs text-[#718278] dark:text-[#8ea095] font-bold mt-2">
                {pomodoroPhase === 'work' 
                  ? 'جلسة تركيز عميق قيد التشغيل' 
                  : pomodoroPhase === 'short_break' 
                  ? 'استراحة قصيرة: تمدد، اشرب ماء، وتنفس بعمق' 
                  : 'استراحة طويلة: استعد طاقتك بالكامل'}
              </p>
            </div>

            {/* Tomato completed counters */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-[#718278] dark:text-[#8ea095] font-bold">بومودورو اليوم:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.max(4, completedPomodorosCount) }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`text-base transition-transform ${
                      idx < completedPomodorosCount ? 'scale-110 opacity-100' : 'opacity-25 grayscale'
                    }`}
                    title={`جلسة ${idx + 1}`}
                  >
                    🍅
                  </span>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* FLOWTIME MODE DISPLAY */
          <div className="mt-8 space-y-6 relative z-10">
            
            {/* Notice if in suggested break */}
            {suggestedBreakNotice && (
              <div className="max-w-md mx-auto p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 shadow-2xs">
                <Coffee className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>{suggestedBreakNotice}</span>
              </div>
            )}

            {/* Giant Stopwatch Display */}
            <div className="py-4 select-none">
              <div className="text-6xl sm:text-8xl font-black tracking-tight text-[#1a2420] dark:text-white font-mono tabular-nums">
                {isInBreak ? formatTime(breakSecondsRemaining) : formatTime(flowSeconds)}
              </div>
              <p className="text-xs text-[#718278] dark:text-[#8ea095] font-bold mt-2">
                {isInBreak 
                  ? '⏳ استراحة التدفق المقترحة (تنازلي)' 
                  : isActive 
                  ? '🌊 حالة التدفق نشطة (Stopwatch) - اعمل بحرية حتى تشعر بالحاجة للراحة' 
                  : 'جاهز لبدء التدفق الحر؟ اضغط تشغيل'}
              </p>
            </div>

            {/* Flowtime Break Recommendation Helper pills */}
            <div className="max-w-lg mx-auto bg-[#faf8f4] dark:bg-[#18261e] border border-[#e8e4db] dark:border-[#223328] rounded-2xl p-3 text-[11px] text-[#637269] dark:text-[#8ea095] flex items-center justify-around">
              <span>أقل من 25د: <strong>راحة 5د</strong></span>
              <span>•</span>
              <span>25-50د: <strong>راحة 8د</strong></span>
              <span>•</span>
              <span>50-90د: <strong>راحة 15د</strong></span>
              <span>•</span>
              <span>+90د: <strong>راحة 25د</strong></span>
            </div>

          </div>
        )}

        {/* Primary Controls Row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 relative z-10">
          
          {/* Start / Pause Button */}
          <button
            type="button"
            onClick={handleToggleTimer}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black transition-all shadow-md hover:shadow-lg cursor-pointer ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-[#174235] dark:bg-emerald-600 hover:bg-[#12362b] dark:hover:bg-emerald-700 text-white'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{mode === 'flowtime' && flowSeconds > 0 ? 'استئناف التدفق' : 'ابدأ التركيز الآن'}</span>
              </>
            )}
          </button>

          {/* Flowtime: Take Break button */}
          {mode === 'flowtime' && flowSeconds > 60 && !isInBreak && (
            <button
              type="button"
              onClick={handleFlowtimeBreak}
              className="flex items-center gap-1.5 px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-black shadow-xs cursor-pointer transition-all"
            >
              <Coffee className="w-4 h-4" />
              <span>أخذ استراحة وتدوين التدفق</span>
            </button>
          )}

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetTimer}
            className="p-3.5 bg-[#f4f2ed] dark:bg-[#1c2a22] hover:bg-[#eae6dd] dark:hover:bg-[#23362b] text-[#4d5c52] dark:text-white rounded-2xl border border-[#dedad0] dark:border-[#2d4034] transition-colors cursor-pointer"
            title="إعادة ضبط المؤقت"
            aria-label="إعادة ضبط المؤقت"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Mindful Distraction Button */}
          {isActive && (
            <button
              type="button"
              onClick={() => setDistractionsCount(prev => prev + 1)}
              className="flex items-center gap-1.5 px-4 py-3 bg-[#fdf8f4] dark:bg-amber-950/20 hover:bg-[#fbede1] text-[#b45309] dark:text-amber-400 border border-[#fed7aa] dark:border-amber-800/40 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              title="سجل التشتت الذهني لملاحظته دون الاستسلام له"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>تشتت ({distractionsCount})</span>
            </button>
          )}

          {/* Complete Task Button */}
          {activeTask && (
            <button
              type="button"
              onClick={handleCompleteCurrentTask}
              className="flex items-center gap-1.5 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>تم إنجاز المهمة بنجاح 🎉</span>
            </button>
          )}

        </div>

      </div>

      {/* 3. Today's Productivity & Focus Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4ef] dark:bg-[#192b22] text-[#174235] dark:text-emerald-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#718278] dark:text-[#8ea095] font-bold block">إجمالي التركيز اليوم</span>
            <span className="text-xl font-black text-[#1a2420] dark:text-white font-mono tabular-nums">{totalFocusMinutesToday} دقيقة</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#718278] dark:text-[#8ea095] font-bold block">عدد الجلسات المكتملة</span>
            <span className="text-xl font-black text-[#1a2420] dark:text-white font-mono tabular-nums">{todaySessions.length} جلسات</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 flex items-center justify-center font-bold">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#718278] dark:text-[#8ea095] font-bold block">متوسط مدة الجلسة</span>
            <span className="text-xl font-black text-[#1a2420] dark:text-white font-mono tabular-nums">
              {todaySessions.length > 0 ? Math.round(totalFocusMinutesToday / todaySessions.length) : 0} دقيقة
            </span>
          </div>
        </div>

      </div>

      {/* 4. Focus Session Log History */}
      {sessionsHistory.length > 0 && (
        <div className="bg-white dark:bg-[#131d18] border border-[#e8e5de] dark:border-[#26372d] rounded-2xl p-5 shadow-2xs transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0eee9] dark:border-[#223028]">
            <h3 className="text-xs font-black text-[#1a2420] dark:text-white flex items-center gap-1.5">
              <span>سجل جلسات التركيز الموثقة</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f4f2ed] dark:bg-[#1a2620] text-[#637269] dark:text-[#8ea095] font-mono tabular-nums">
                {sessionsHistory.length}
              </span>
            </h3>
          </div>

          <div className="divide-y divide-[#f2efe9] dark:divide-[#223028] mt-2 max-h-60 overflow-y-auto">
            {sessionsHistory.slice(0, 8).map((session) => (
              <div key={session.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm">
                    {session.mode === 'pomodoro' ? '🍅' : '🌊'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1a2420] dark:text-white truncate">
                      {session.task_title || 'جلسة تركيز'}
                    </p>
                    {session.project_title && (
                      <p className="text-[10px] text-[#718278] dark:text-[#8ea095] truncate">
                        {session.project_title}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-[11px] font-bold text-[#55645b] dark:text-[#9bb0a3]">
                  <span className="px-2 py-0.5 rounded-md bg-[#faf8f4] dark:bg-[#18261e] border border-[#e8e4db] dark:border-[#26372d] font-mono tabular-nums">
                    {Math.round(session.duration_seconds / 60)} دقيقة
                  </span>
                  <span className="text-[10px] text-[#86968c] dark:text-[#6a7c71] font-mono tabular-nums">
                    {new Date(session.completed_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
