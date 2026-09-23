"use client";

import { useTransition } from "react";
import { Check, Flame, Moon, Sparkles, Sun } from "lucide-react";
import type { HabitWithTodayStatus } from "@bawsala/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logAdhkarAction } from "../actions";

export function AdhkarTracker({ habit, locale }: { habit: HabitWithTodayStatus; locale: string }) {
  const [isPending, startTransition] = useTransition();
  const metadata = (habit.todayLog?.metadata as Record<string, boolean>) || {};
  const isAr = locale === "ar";

  const morningDone = Boolean(metadata.morning);
  const eveningDone = Boolean(metadata.evening);
  const completedCount = (morningDone ? 1 : 0) + (eveningDone ? 1 : 0);
  const isFullyCompleted = completedCount === 2;

  const handleToggle = (period: "morning" | "evening", currentState: boolean) => {
    startTransition(async () => {
      await logAdhkarAction(habit.id, period, !currentState, metadata);
    });
  };

  return (
    <Card className="border-indigo-500/30 bg-indigo-500/5 shadow-xs">
      <CardHeader className="pb-3 border-b border-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-base font-bold">
              {isAr ? "أذكار الصباح والمساء" : "Morning & Evening Adhkar"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                isFullyCompleted
                  ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isFullyCompleted && <Check className="size-3.5" />}
              {completedCount} / 2 {isAr ? "مكتملة" : "done"}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Flame className="size-3" />
              {habit.currentStreak} {isAr ? "يوم" : "d"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Morning Adhkar Card */}
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleToggle("morning", morningDone)}
          className={`flex items-center justify-between p-3 rounded-lg border text-start transition-all ${
            morningDone
              ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100 shadow-xs"
              : "border-border bg-card/60 hover:bg-card text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-md ${
                morningDone
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Sun className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">
                {isAr ? "أذكار الصباح" : "Morning Adhkar"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isAr ? "بعد صلاة الفجر إلى الشروق" : "After Fajr to sunrise"}
              </span>
            </div>
          </div>

          <div
            className={`size-6 rounded-full flex items-center justify-center border transition-all ${
              morningDone
                ? "bg-amber-500 border-amber-500 text-white"
                : "border-muted-foreground/30 bg-background"
            }`}
          >
            {morningDone && <Check className="size-3.5" />}
          </div>
        </button>

        {/* Evening Adhkar Card */}
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleToggle("evening", eveningDone)}
          className={`flex items-center justify-between p-3 rounded-lg border text-start transition-all ${
            eveningDone
              ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-900 dark:text-indigo-100 shadow-xs"
              : "border-border bg-card/60 hover:bg-card text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-md ${
                eveningDone
                  ? "bg-indigo-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Moon className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">
                {isAr ? "أذكار المساء" : "Evening Adhkar"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isAr ? "بعد صلاة العصر إلى الغروب" : "After Asr to sunset"}
              </span>
            </div>
          </div>

          <div
            className={`size-6 rounded-full flex items-center justify-center border transition-all ${
              eveningDone
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-muted-foreground/30 bg-background"
            }`}
          >
            {eveningDone && <Check className="size-3.5" />}
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
