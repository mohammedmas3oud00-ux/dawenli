"use client";

import { useState, useTransition } from "react";
import { BookOpen, Check, Flame, Plus } from "lucide-react";
import type { HabitWithTodayStatus } from "@bawsala/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { logQuranAction } from "../actions";

export function QuranTracker({ habit, locale }: { habit: HabitWithTodayStatus; locale: string }) {
  const [isPending, startTransition] = useTransition();
  const metadata = (habit.todayLog?.metadata as Record<string, unknown>) || {};
  const isAr = locale === "ar";

  const targetPages = habit.targetCount ?? 4;
  const currentPagesRead = Number(metadata.pagesRead ?? habit.todayLog?.value ?? 0);
  const initialCurrentPage = typeof metadata.currentPage === "number" ? metadata.currentPage : "";

  const [pageInput, setPageInput] = useState<number | string>(initialCurrentPage);

  const percent = targetPages > 0 ? Math.min(100, Math.round((currentPagesRead / targetPages) * 100)) : 0;
  const isCompleted = currentPagesRead >= targetPages;

  const handleAddPages = (additional: number) => {
    const newPagesRead = Math.max(0, currentPagesRead + additional);
    startTransition(async () => {
      const pageNum = Number(pageInput);
      await logQuranAction(
        habit.id,
        newPagesRead,
        pageNum > 0 ? pageNum : undefined,
        metadata,
      );
    });
  };

  const handleSaveCurrentPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = Number(pageInput);
    if (!pageNum || pageNum <= 0) return;

    startTransition(async () => {
      await logQuranAction(habit.id, currentPagesRead, pageNum, metadata);
    });
  };

  return (
    <Card className="border-teal-500/30 bg-teal-500/5 shadow-xs">
      <CardHeader className="pb-3 border-b border-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-base font-bold">
              {isAr ? "متابعة ورد القرآن الكريم" : "Daily Quran Reading"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                isCompleted
                  ? "bg-teal-500/20 text-teal-700 dark:text-teal-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted && <Check className="size-3.5" />}
              {currentPagesRead} / {targetPages} {isAr ? "صفحة" : "pages"}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Flame className="size-3" />
              {habit.currentStreak} {isAr ? "يوم" : "d"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-4">
        {/* Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{isAr ? "إنجاز الورد اليومي" : "Daily Goal Progress"}</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400">{percent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-teal-950/10 dark:bg-teal-100/10 overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Quick Stepper Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {isAr ? "تسجيل قراءة:" : "Add pages:"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleAddPages(1)}
            className="h-7 text-xs bg-card/60"
          >
            <Plus className="size-3 me-1" />
            +1 {isAr ? "صفحة" : "page"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleAddPages(2)}
            className="h-7 text-xs bg-card/60"
          >
            <Plus className="size-3 me-1" />
            +2 {isAr ? "صفحتان" : "pages"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleAddPages(4)}
            className="h-7 text-xs bg-card/60"
          >
            <Plus className="size-3 me-1" />
            +4 {isAr ? "صفحات (حزب)" : "pages"}
          </Button>
          {currentPagesRead > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => handleAddPages(-currentPagesRead)}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              {isAr ? "تصفير" : "Reset"}
            </Button>
          )}
        </div>

        {/* Current Mus'haf Page Bookmark */}
        <form onSubmit={handleSaveCurrentPage} className="flex items-center gap-2 pt-1 border-t border-teal-500/10">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {isAr ? "رقم الصفحة التي وصلت إليها:" : "Current Mus'haf page:"}
          </span>
          <Input
            type="number"
            min={1}
            max={604}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder="e.g. 142"
            className="h-7 w-24 text-xs"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isPending || !pageInput}
            className="h-7 text-xs"
          >
            {isAr ? "حفظ الصفحة" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
