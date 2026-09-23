"use client";

import { useTransition } from "react";
import { Check, Flame, Moon } from "lucide-react";
import type { HabitWithTodayStatus } from "@bawsala/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logPrayerAction } from "../actions";

const PRAYERS = [
  { key: "fajr", en: "Fajr", ar: "الفجر" },
  { key: "dhuhr", en: "Dhuhr", ar: "الظهر" },
  { key: "asr", en: "Asr", ar: "العصر" },
  { key: "maghrib", en: "Maghrib", ar: "المغرب" },
  { key: "isha", en: "Isha", ar: "العشاء" },
] as const;

const STATUSES = [
  { key: "jamaah", en: "Jama'ah", ar: "جماعة", color: "bg-emerald-500 text-white" },
  { key: "on_time", en: "On Time", ar: "في وقتها", color: "bg-primary text-primary-foreground" },
  { key: "late", en: "Late", ar: "قضاء/متأخرة", color: "bg-amber-500 text-white" },
  { key: "missed", en: "Missed", ar: "فائتة", color: "bg-destructive text-destructive-foreground" },
] as const;

export function PrayerTracker({ habit, locale }: { habit: HabitWithTodayStatus; locale: string }) {
  const [isPending, startTransition] = useTransition();
  const metadata = (habit.todayLog?.metadata as Record<string, string>) || {};

  const handleSetStatus = (prayer: string, status: string) => {
    startTransition(async () => {
      await logPrayerAction(habit.id, prayer, status, metadata);
    });
  };

  const performedCount = PRAYERS.filter(
    (p) => metadata[p.key] && metadata[p.key] !== "missed",
  ).length;

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs">
      <CardHeader className="pb-3 border-b border-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="size-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base font-bold">
              {locale === "ar" ? "متابعة الصلوات الخمس اليومية" : "Daily 5 Prayers Tracker"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Check className="size-3.5" />
              {performedCount} / 5 {locale === "ar" ? "صلوات" : "prayers"}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Flame className="size-3" />
              {habit.currentStreak} {locale === "ar" ? "يوم" : "d"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {PRAYERS.map((p) => {
            const currentStatus = metadata[p.key];
            return (
              <div
                key={p.key}
                className="flex flex-col gap-1.5 p-2 rounded-lg border bg-card/60 text-center"
              >
                <span className="text-xs font-semibold">{locale === "ar" ? p.ar : p.en}</span>
                <div className="flex flex-col gap-1">
                  {STATUSES.map((s) => {
                    const isSelected = currentStatus === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSetStatus(p.key, s.key)}
                        className={`text-[11px] py-1 px-1 rounded transition-all font-medium ${
                          isSelected
                            ? `${s.color} font-bold shadow-xs`
                            : "bg-muted/50 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {locale === "ar" ? s.ar : s.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
