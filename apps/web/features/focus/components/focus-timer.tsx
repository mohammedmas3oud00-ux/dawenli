"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Check,
  Clock,
  History,
  Pause,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import type { Task, TimeEntry } from "@bawsala/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { toggleTaskAction } from "@/features/tasks/actions";
import { saveFocusSessionAction } from "../actions";

interface FocusTimerProps {
  tasks: Task[];
  locale: string;
  initialTaskId?: string;
  stats?: { todayMinutes: number; todaySessions: number };
  recentEntries?: TimeEntry[];
}

export function FocusTimer({
  tasks,
  locale,
  initialTaskId,
  stats = { todayMinutes: 0, todaySessions: 0 },
  recentEntries = [],
}: FocusTimerProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"pomodoro" | "deep" | "short_break">("pomodoro");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskId || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const isAr = locale === "ar";

  const warmAudioContext = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume();
      }
    } catch {
      // Ignore audio context unlock errors
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled && typeof window !== "undefined") {
              try {
                const AudioCtx =
                  window.AudioContext ||
                  (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext;
                const ctx = audioContextRef.current || new AudioCtx();
                if (ctx.state === "suspended") {
                  void ctx.resume();
                }
                const osc = ctx.createOscillator();
                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
              } catch {
                // Ignore audio context autoplay limitations
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, soundEnabled]);

  const switchMode = (m: "pomodoro" | "deep" | "short_break") => {
    setMode(m);
    setIsRunning(false);
    const mins = m === "pomodoro" ? 25 : m === "deep" ? 50 : 5;
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(durationMinutes * 60);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progressPercent =
    ((durationMinutes * 60 - secondsRemaining) / (durationMinutes * 60)) * 100;

  const handleMarkTaskDone = async () => {
    if (!selectedTaskId) return;
    await toggleTaskAction(selectedTaskId, "todo");
  };

  const handleSaveSession = () => {
    // Determine elapsed minutes (at least 1 minute)
    const elapsedSeconds = durationMinutes * 60 - secondsRemaining;
    const elapsedMins = Math.max(1, Math.round(elapsedSeconds / 60));

    startTransition(async () => {
      await saveFocusSessionAction(selectedTaskId || null, elapsedMins, mode);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full">
      {/* Mode switcher tabs */}
      <div className="flex justify-center gap-2 p-1 bg-muted rounded-xl">
        <button
          type="button"
          onClick={() => switchMode("pomodoro")}
          className={`text-xs font-semibold py-2 px-4 rounded-lg transition-all ${
            mode === "pomodoro"
              ? "bg-background shadow-xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {isAr ? "بومودورو (25 دقيقة)" : "Pomodoro (25m)"}
        </button>
        <button
          type="button"
          onClick={() => switchMode("deep")}
          className={`text-xs font-semibold py-2 px-4 rounded-lg transition-all ${
            mode === "deep"
              ? "bg-background shadow-xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {isAr ? "جلسة عمل عميق (50 دقيقة)" : "Deep Work (50m)"}
        </button>
        <button
          type="button"
          onClick={() => switchMode("short_break")}
          className={`text-xs font-semibold py-2 px-4 rounded-lg transition-all ${
            mode === "short_break"
              ? "bg-background shadow-xs text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {isAr ? "استراحة قصيرة (5 دقائق)" : "Short Break (5m)"}
        </button>
      </div>

      {/* Main Timer Display */}
      <Card className="border-primary/20 bg-gradient-to-b from-card to-card/60 shadow-lg text-center p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-primary/5 transition-all duration-1000 ease-linear pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />
        <CardContent className="pt-6 relative flex flex-col items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="font-mono text-7xl md:text-8xl font-black tracking-tight select-none">
              {timeFormatted}
            </span>
            <span className="text-xs text-muted-foreground mt-2 flex items-center gap-1 uppercase tracking-widest font-semibold">
              <Zap className="size-3 text-amber-500" />
              {isRunning
                ? isAr
                  ? "جلسة تركيز جارية"
                  : "Focus in progress"
                : isAr
                  ? "جاهز للبدء"
                  : "Ready to focus"}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center items-center gap-3">
            <Button
              size="lg"
              variant={isRunning ? "outline" : "default"}
              className="gap-2 px-8 font-bold text-base h-12 rounded-xl shadow-md"
              onClick={() => {
                if (!isRunning) warmAudioContext();
                setIsRunning(!isRunning);
              }}
            >
              {isRunning ? <Pause className="size-5" /> : <Play className="size-5" />}
              <span>
                {isRunning ? (isAr ? "إيقاف مؤقت" : "Pause") : isAr ? "بدء التركيز" : "Start Focus"}
              </span>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="size-12 rounded-xl"
              onClick={resetTimer}
              title="Reset timer"
            >
              <RotateCcw className="size-4" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="size-12 rounded-xl"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute audio alert" : "Enable audio alert"}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </Button>

            {/* Save Session Button */}
            {(secondsRemaining < durationMinutes * 60 || secondsRemaining === 0) && (
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleSaveSession}
                className="h-10 px-4 text-xs font-semibold gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50"
              >
                {savedSuccess ? <Check className="size-4" /> : <Save className="size-4" />}
                <span>
                  {savedSuccess
                    ? isAr
                      ? "تم حفظ الجلسة!"
                      : "Saved!"
                    : isAr
                      ? "تسجيل الوقت"
                      : "Log Time"}
                </span>
              </Button>
            )}
          </div>

          {/* Linked Task Selector */}
          <div className="w-full border-t pt-4 flex flex-col gap-2 text-start">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Timer className="size-3 text-primary" />
              {isAr ? "ربط جلسة التركيز بمهمة محددة:" : "Focusing on task:"}
            </label>
            <div className="flex gap-2">
              <Select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="flex-1 text-xs"
              >
                <option value="">
                  {isAr ? "اختر مهمة من قائمة المهام..." : "Select task to work on..."}
                </option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
              {selectedTaskId ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={handleMarkTaskDone}
                >
                  <Check className="size-3.5" />
                  <span>{isAr ? "تم الإنجاز" : "Complete"}</span>
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Focus & Time Statistics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Clock className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{stats.todayMinutes}</span>
            <span className="text-xs text-muted-foreground">
              {isAr ? "دقائق تركيز اليوم" : "Focus minutes today"}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{stats.todaySessions}</span>
            <span className="text-xs text-muted-foreground">
              {isAr ? "جلسات مكتملة اليوم" : "Sessions today"}
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Sessions History */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                {isAr ? "سجل جلسات التركيز الأخيرة" : "Recent Focus Sessions"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3 flex flex-col divide-y">
            {recentEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {entry.mode.replace("_", " ")}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {entry.durationMinutes} {isAr ? "دقيقة" : "min"}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(entry.startedAt).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
