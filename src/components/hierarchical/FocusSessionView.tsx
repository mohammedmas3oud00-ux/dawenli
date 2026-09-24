import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Waves, 
  Coffee, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  Clock,
  Zap,
  Calendar,
  Target
} from 'lucide-react';
import { Task, Project, Pillar, FocusMode, FocusSessionRecord } from '../../types/hierarchical';
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
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [flowSeconds, setFlowSeconds] = useState<number>(0);
  const [isInBreak, setIsInBreak] = useState<boolean>(false);
  const [breakSecondsRemaining, setBreakSecondsRemaining] = useState<number>(0);

  // Distraction & session metrics
  const [distractionsCount, setDistractionsCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedPomodorosCount, setCompletedPomodorosCount] = useState<number>(0);
  const [suggestedBreakNotice, setSuggestedBreakNotice] = useState<string | null>(null);

  const activeTask = tasks.find(t => t.id === selectedTaskId) || initialTask;
  const activeProject = activeTask ? projects.find(p => p.id === activeTask.project_id) : undefined;
  const activePillar = activeProject ? pillars.find(p => p.id === (activeProject as any).pillar_id) : undefined;

  const activeTasksList = tasks.filter(t => t.status !== 'done');

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

  // Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      if (mode === 'pomodoro') {
        if (secondsRemaining > 0) {
          interval = setInterval(() => {
            setSecondsRemaining((prev) => prev - 1);
          }, 1000);
        } else {
          setIsActive(false);
          if (soundEnabled) playFocusSound(pomodoroPhase === 'work' ? 'complete' : 'break');

          if (pomodoroPhase === 'work') {
            setCompletedPomodorosCount(prev => prev + 1);
            logCurrentSession(workDurationMinutes * 60, 'pomodoro');
          }
        }
      } else {
        if (isInBreak) {
          if (breakSecondsRemaining > 0) {
            interval = setInterval(() => {
              setBreakSecondsRemaining((prev) => prev - 1);
            }, 1000);
          } else {
            setIsInBreak(false);
            setIsActive(false);
            if (soundEnabled) playFocusSound('break');
            setSuggestedBreakNotice(null);
          }
        } else {
          interval = setInterval(() => {
            setFlowSeconds((prev) => prev + 1);
          }, 1000);
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, flowSeconds, isInBreak, breakSecondsRemaining, mode, pomodoroPhase, soundEnabled]);

  const logCurrentSession = (durationSecs: number, sessionType: FocusMode) => {
    if (durationSecs < 60) return;

    const record: FocusSessionRecord = {
      id: `focus-${Date.now()}`,
      task_id: selectedTaskId || null,
      task_title: activeTask?.title,
      project_title: activeProject?.title,
      pillar_title: activePillar?.title,
      duration_seconds: durationSecs,
      mode: sessionType,
      completed_at: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      distractions_count: distractionsCount,
      notes: customIntention || activeTask?.title || 'جلسة تركيز حر',
    };

    onSaveSession(record);
  };

  const handleToggleTimer = () => {
    if (!isActive && soundEnabled) {
      playFocusSound('start');
    }
    setIsActive(!isActive);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    if (mode === 'pomodoro') {
      setSecondsRemaining(
        pomodoroPhase === 'work' 
          ? workDurationMinutes * 60 
          : pomodoroPhase === 'short_break' 
          ? shortBreakMinutes * 60 
          : longBreakMinutes * 60
      );
    } else {
      setFlowSeconds(0);
      setIsInBreak(false);
      setBreakSecondsRemaining(0);
      setSuggestedBreakNotice(null);
    }
  };

  const handleFlowtimeBreak = () => {
    if (flowSeconds < 60) return;
    const minsWorked = Math.floor(flowSeconds / 60);

    let breakMins = 5;
    if (minsWorked > 90) breakMins = 25;
    else if (minsWorked > 50) breakMins = 15;
    else if (minsWorked > 25) breakMins = 8;

    logCurrentSession(flowSeconds, 'flowtime');

    setBreakSecondsRemaining(breakMins * 60);
    setIsInBreak(true);
    setFlowSeconds(0);
    setSuggestedBreakNotice(`استراحة مستحقة: ${breakMins} دقائق بعد تدفق دام ${minsWorked} دقيقة.`);
  };

  const handleCompleteCurrentTask = () => {
    if (activeTask) {
      onToggleTaskStatus(activeTask.id);
      if (mode === 'pomodoro') {
        logCurrentSession(workDurationMinutes * 60 - secondsRemaining, 'pomodoro');
      } else {
        logCurrentSession(flowSeconds, 'flowtime');
      }
      setIsActive(false);
    }
    if (soundEnabled) playFocusSound('complete');
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessionsHistory.filter(s => s.date === todayStr);
  const totalFocusSecondsToday = todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0);
  const totalFocusMinutesToday = Math.round(totalFocusSecondsToday / 60);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. Header & Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍅</span>
              <h1 className="text-base sm:text-xl font-black text-[#1a2420] dark:text-slate-100">
                مركز جلسات التركيز العميق
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-[#ebf4f0] dark:bg-emerald-950/70 text-[#174235] dark:text-emerald-300 border border-[#cfe3d9] dark:border-emerald-800">
                {mode === 'pomodoro' ? 'تقنية بومودورو' : 'تقنية التدفق الحر'}
              </span>
            </div>
            <p className="text-xs text-[#636e67] dark:text-slate-400">
              اختر مهمتك وادخل في حالة التدفق الذهني الخالية من المشتتات مع قياس وقتك الفعلي.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-[#ebf4f0] dark:bg-emerald-950 text-[#174235] dark:text-emerald-300 border-[#cfe3d9] dark:border-emerald-800' 
                  : 'bg-[#faf8f4] dark:bg-slate-800 text-[#86968c] dark:text-slate-500 border-[#e8e4db] dark:border-slate-700'
              }`}
              title={soundEnabled ? 'كتم التنبيهات الصوتية' : 'تفعيل التنبيهات الصوتية'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Time Blocking link */}
            {onOpenTimeBlocking && (
              <button
                type="button"
                onClick={onOpenTimeBlocking}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-[#f6f5f1] dark:hover:bg-slate-700 text-[#3a443f] dark:text-slate-200 border border-[#e3dfd7] dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-[#174235] dark:text-emerald-400" />
                <span>جدول حجب الوقت</span>
              </button>
            )}

            {/* Back button */}
            {onBackToHierarchy && (
              <button
                type="button"
                onClick={onBackToHierarchy}
                className="flex items-center gap-1 px-3 py-2 bg-[#f4f2ed] dark:bg-slate-800 hover:bg-[#ebe7df] dark:hover:bg-slate-700 text-[#334239] dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <span>العودة للرئيسية</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#f0eee9] dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsActive(false);
              setMode('pomodoro');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'pomodoro'
                ? 'bg-[#174235] dark:bg-emerald-700 text-white shadow-xs'
                : 'bg-[#f4f2ed] dark:bg-slate-800 text-[#55645b] dark:text-slate-400 hover:bg-[#eae6dd] dark:hover:bg-slate-700'
            }`}
          >
            <span>🍅</span>
            <span>بومودورو</span>
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
                ? 'bg-[#174235] dark:bg-emerald-700 text-white shadow-xs'
                : 'bg-[#f4f2ed] dark:bg-slate-800 text-[#55645b] dark:text-slate-400 hover:bg-[#eae6dd] dark:hover:bg-slate-700'
            }`}
          >
            <Waves className="w-4 h-4 text-cyan-400" />
            <span>تقنية التدفق الحر</span>
            <span className="text-[10px] opacity-80 font-normal">عداد تصاعدي بلا مقاطعة</span>
          </button>
        </div>
      </div>

      {/* 2. Main Focus Stage Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-sm text-center relative overflow-hidden">
        
        {/* Task Selection Section */}
        <div className="max-w-xl mx-auto space-y-3 relative z-10">
          <label className="block text-xs font-bold text-[#55645b] dark:text-slate-400 text-right">
            المهمة المراد التركيز عليها الآن:
          </label>

          <div className="relative">
            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                if (e.target.value) setCustomIntention('');
              }}
              className="w-full py-2.5 px-3.5 text-xs font-bold rounded-xl border border-[#d8d4cc] dark:border-slate-700 bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235] cursor-pointer"
            >
              <option value="">🎯 نية تركيز حرة (بدون مهمة مسجلة)</option>
              {activeTasksList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority === 'high' ? 'أولوية قصوى' : t.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية هادئة'})
                </option>
              ))}
            </select>
          </div>

          {!selectedTaskId && (
            <input
              type="text"
              value={customIntention}
              onChange={(e) => setCustomIntention(e.target.value)}
              placeholder="اكتب نية التركيز لجلسة اليوم (مثلاً: إنهاء مراجعة الكود، قراءة 20 صفحة)..."
              className="w-full px-3.5 py-2 border border-[#d8d4cc] dark:border-slate-700 rounded-xl text-xs bg-[#faf8f5] dark:bg-slate-800 text-[#1a2420] dark:text-slate-100 outline-hidden focus:border-[#174235] transition-all"
            />
          )}

          {/* Active Task Breadcrumb context if linked */}
          {activeTask && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#6e7d73] dark:text-slate-400 pt-1">
              {activePillar && (
                <span className="font-bold text-[#1a2420] dark:text-slate-200">🏛️ {activePillar.title}</span>
              )}
              {activeProject && (
                <>
                  <span className="text-[#c2bcaf]">/</span>
                  <span className="font-semibold text-[#174235] dark:text-emerald-400">📁 {activeProject.title}</span>
                </>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTask.priority === 'high' 
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' 
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
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
            <div className="inline-flex flex-wrap items-center justify-center bg-[#f4f2ed] dark:bg-slate-800 p-1 rounded-2xl border border-[#e4e0d6] dark:border-slate-700 gap-1">
              <button
                type="button"
                onClick={() => switchPomodoroPhase('work')}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pomodoroPhase === 'work'
                    ? 'bg-[#174235] dark:bg-emerald-700 text-white shadow-2xs'
                    : 'text-[#637269] dark:text-slate-400 hover:text-[#174235]'
                }`}
              >
                <span>🧠</span>
                <span>تركيز ({workDurationMinutes}د)</span>
              </button>

              <button
                type="button"
                onClick={() => switchPomodoroPhase('short_break')}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pomodoroPhase === 'short_break'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'text-[#637269] dark:text-slate-400 hover:text-amber-800'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>راحة قصيرة ({shortBreakMinutes}د)</span>
              </button>

              <button
                type="button"
                onClick={() => switchPomodoroPhase('long_break')}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  pomodoroPhase === 'long_break'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'text-[#637269] dark:text-slate-400 hover:text-sky-800'
                }`}
              >
                <span>🌴</span>
                <span>راحة طويلة ({longBreakMinutes}د)</span>
              </button>
            </div>

            {/* Digital Countdown Display */}
            <div className="py-2 select-none">
              <div className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-[#1a2420] dark:text-slate-100 font-mono tabular-nums">
                {formatTime(secondsRemaining)}
              </div>
              <p className="text-xs text-[#718278] dark:text-slate-400 font-bold mt-2">
                {pomodoroPhase === 'work' 
                  ? 'جلسة تركيز قيد التشغيل' 
                  : pomodoroPhase === 'short_break' 
                  ? 'استراحة قصيرة: تمدد، اشرب ماء، وتنفس بعمق' 
                  : 'استراحة طويلة: استعد طاقتك بالكامل'}
              </p>
            </div>

            {/* Tomato completed counters */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-[#718278] dark:text-slate-400 font-bold">جلسات اليوم:</span>
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
            {suggestedBreakNotice && (
              <div className="max-w-md mx-auto p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 shadow-2xs">
                <Coffee className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{suggestedBreakNotice}</span>
              </div>
            )}

            <div className="py-2 select-none">
              <div className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-[#1a2420] dark:text-slate-100 font-mono tabular-nums">
                {isInBreak ? formatTime(breakSecondsRemaining) : formatTime(flowSeconds)}
              </div>
              <p className="text-xs text-[#718278] dark:text-slate-400 font-bold mt-2">
                {isInBreak 
                  ? 'استراحة التدفق المقترحة (تنازلي)' 
                  : isActive 
                  ? 'حالة التدفق نشطة - اعمل بحرية حتى تشعر بالحاجة للراحة' 
                  : 'جاهز لبدء التدفق الحر؟ اضغط تشغيل'}
              </p>
            </div>

            <div className="max-w-lg mx-auto bg-[#faf8f4] dark:bg-slate-800 border border-[#e8e4db] dark:border-slate-700 rounded-2xl p-3 text-[11px] text-[#637269] dark:text-slate-400 flex flex-wrap items-center justify-around gap-2">
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

        {/* Primary Controls Row - Wrap cleanly without overlapping */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 relative z-10">
          
          {/* Start / Pause Button */}
          <button
            type="button"
            onClick={handleToggleTimer}
            className={`flex items-center gap-2 px-6 sm:px-8 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md hover:shadow-lg cursor-pointer ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-[#174235] dark:bg-emerald-700 hover:bg-[#12362b] text-white'
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
              className="flex items-center gap-1.5 px-4 sm:px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-black shadow-xs cursor-pointer transition-all"
            >
              <Coffee className="w-4 h-4" />
              <span>أخذ استراحة وتدوين التدفق</span>
            </button>
          )}

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetTimer}
            className="p-3 bg-[#f4f2ed] dark:bg-slate-800 hover:bg-[#eae6dd] dark:hover:bg-slate-700 text-[#4d5c52] dark:text-slate-300 rounded-2xl border border-[#dedad0] dark:border-slate-700 transition-colors cursor-pointer"
            title="إعادة ضبط المؤقت"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Distraction Button */}
          {isActive && (
            <button
              type="button"
              onClick={() => setDistractionsCount(prev => prev + 1)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-3 bg-[#fdf8f4] dark:bg-amber-950/60 hover:bg-[#fbede1] text-[#b45309] dark:text-amber-300 border border-[#fed7aa] dark:border-amber-800 rounded-2xl text-xs font-bold transition-all cursor-pointer"
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
              className="flex items-center gap-1.5 px-4 sm:px-5 py-3 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-bold transition-all cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#ebf4ef] dark:bg-emerald-950 text-[#174235] dark:text-emerald-300 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#718278] dark:text-slate-400 font-bold block">إجمالي التركيز اليوم</span>
            <span className="text-xl font-black text-[#1a2420] dark:text-slate-100">{totalFocusMinutesToday} دقيقة</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <span className="text-lg">🍅</span>
          </div>
          <div>
            <span className="text-[11px] text-[#718278] dark:text-slate-400 font-bold block">جلسات مكتملة</span>
            <span className="text-xl font-black text-[#1a2420] dark:text-slate-100">{todaySessions.length} جلسة</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-[#e8e5de] dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#718278] dark:text-slate-400 font-bold block">المهمة النشطة</span>
            <span className="text-xs font-bold text-[#1a2420] dark:text-slate-200 truncate max-w-[180px] block">
              {activeTask?.title || 'نية تركيز حرة'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
