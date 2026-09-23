"use client";

import { useTransition } from "react";
import { Check, Clock, Trash2, Zap } from "lucide-react";
import type { Task } from "@bawsala/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteTaskAction, toggleTaskAction } from "../actions";

const QUADRANT_COLORS: Record<string, "destructive" | "warning" | "info" | "secondary"> = {
  q1: "destructive",
  q2: "warning",
  q3: "info",
  q4: "secondary",
};

const QUADRANT_LABELS: Record<string, string> = {
  q1: "Q1: Do First",
  q2: "Q2: Schedule",
  q3: "Q3: Delegate",
  q4: "Q4: Drop",
};

export function TaskItem({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();
  const isDone = task.status === "done";
  const quadrant = task.eisenhower || "q4";

  const handleToggle = () => {
    startTransition(async () => {
      await toggleTaskAction(task.id, task.status);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTaskAction(task.id);
    });
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-all hover:shadow-xs",
        isDone && "bg-muted/40 opacity-70",
        isPending && "opacity-50 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isDone ? "Mark todo" : "Mark done"}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            isDone
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary",
          )}
        >
          {isDone ? <Check className="size-3.5" /> : null}
        </button>

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-sm font-medium leading-none truncate",
              isDone && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </span>
          {task.description ? (
            <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {task.description}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {task.dueDate ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {task.dueDate}
          </span>
        ) : null}

        {task.energy ? (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground capitalize">
            <Zap className="size-3 text-amber-500" />
            {task.energy}
          </span>
        ) : null}

        <Badge variant={QUADRANT_COLORS[quadrant] || "secondary"} className="text-[10px] uppercase">
          {QUADRANT_LABELS[quadrant] || quadrant}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          onClick={handleDelete}
          title="Delete task"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
