"use client";

import { useTransition } from "react";
import { Check, Flame, Trash2 } from "lucide-react";
import type { HabitWithTodayStatus } from "@bawsala/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteHabitAction, logHabitAction } from "../actions";

export function HabitItem({ habit, locale }: { habit: HabitWithTodayStatus; locale: string }) {
  const [isPending, startTransition] = useTransition();
  const isCompleted = habit.loggedToday;

  const handleToggle = () => {
    startTransition(async () => {
      await logHabitAction(habit.id, isCompleted ? 0 : 1);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteHabitAction(habit.id);
    });
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-all hover:shadow-xs",
        isCompleted && "bg-emerald-500/5 border-emerald-500/30",
        isPending && "opacity-50 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isCompleted ? "Uncheck habit" : "Check habit"}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
            isCompleted
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-muted-foreground/40 hover:border-emerald-500",
          )}
        >
          {isCompleted ? <Check className="size-4" /> : null}
        </button>

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-sm font-medium leading-none truncate",
              isCompleted && "font-semibold text-emerald-700 dark:text-emerald-400",
            )}
          >
            {habit.name}
          </span>
          {habit.description ? (
            <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {habit.description}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Flame className="size-3.5 fill-amber-500" />
          {habit.currentStreak} {locale === "ar" ? "أيام" : "days"}
        </span>

        <Badge variant="outline" className="text-[10px] capitalize">
          {habit.frequency}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          onClick={handleDelete}
          title="Delete habit"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
