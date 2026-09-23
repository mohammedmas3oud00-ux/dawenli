"use client";

import { useEffect, useState } from "react";
import { Check, Pause, Play, RotateCcw, Timer, Volume2, VolumeX, Zap } from "lucide-react";
import type { Task } from "@bawsala/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { toggleTaskAction } from "@/features/tasks/actions";

interface FocusTimerProps {
  tasks: Task[];
  locale: string;
}

export function FocusTimer({ tasks, locale }: FocusTimerProps) {
  const [mode, setMode] = useState<"pomodoro" | "deep" | "short_break">("pomodoro");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

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
                  (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                const ctx = new AudioCtx();
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
  const progressPercent = ((durationMinutes * 60 - secondsRemaining) / (durationMinutes * 60)) * 100;

  const handleMarkTaskDone = async () => {
    if (!selectedTaskId) return;
    await toggleTaskAction(selectedTaskId, "todo");
    setSelectedTaskId("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      {/* Mode switcher tabs */}
      <div className="flex justify-center gap-2 p-1 bg-muted rounded-xl">
        <button
          type="button"
          onClick={() => switchMode("pomodoro")}
          className={`text-xs font-semibold py-2 px-4 rounded-lg transition-all ${
            mode === "pomodoro" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "ar" ? "بومودورو (25 دقيقة)" : "Pomodoro (25m)"}
        </button>
        <button
          type="button"
          onClick={() => switchMode("deep")}
          className={`text-xs font-semibold py-2 px-4 rounded-lg transition-all ${
            mode === "deep" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "ar" ? "جلسة عمل عميق (50 دقيقة)" : "Deep Work (50m)"}
        </button>
        <button
          type="button"
          onClick={() => switchMode("short_break")}
          className={`text-xs font-semibold py-2 px-4 rounded-lg transition-all ${
            mode === "short_break" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "ar" ? "استراحة قصيرة (5 دقائق)" : "Short Break (5m)"}
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
              {isRunning ? (locale === "ar" ? "جلسة تركيز جارية" : "Focus in progress") : (locale === "ar" ? "جاهز للبدء" : "Ready to focus")}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              variant={isRunning ? "outline" : "default"}
              className="gap-2 px-8 font-bold text-base h-12 rounded-xl shadow-md"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause className="size-5" /> : <Play className="size-5" />}
              <span>{isRunning ? (locale === "ar" ? "إيقاف مؤقت" : "Pause") : (locale === "ar" ? "بدء التركيز" : "Start Focus")}</span>
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
          </div>

          {/* Linked Task Selector */}
          <div className="w-full border-t pt-4 flex flex-col gap-2 text-start">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Timer className="size-3 text-primary" />
              {locale === "ar" ? "ربط جلسة التركيز بمهمة محددة:" : "Focusing on task:"}
            </label>
            <div className="flex gap-2">
              <Select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="flex-1 text-xs"
              >
                <option value="">{locale === "ar" ? "اختر مهمة من قائمة اليوم..." : "Select task to work on..."}</option>
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
                  <span>{locale === "ar" ? "تم الإنجاز" : "Complete"}</span>
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
