"use client";

import { useTransition } from "react";
import { FolderKanban, Trash2 } from "lucide-react";
import type { GoalWithProgress } from "@bawsala/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { deleteGoalAction } from "../actions";

export function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteGoalAction(goal.id);
    });
  };

  const progressPercent = Math.round(goal.progress);

  return (
    <Card className="group relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] capitalize">
                {goal.horizon}
              </Badge>
              {goal.periodEnd ? (
                <span className="text-xs text-muted-foreground font-mono">{goal.periodEnd}</span>
              ) : null}
            </div>
            <CardTitle className="text-base font-bold mt-1">{goal.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            onClick={handleDelete}
            disabled={isPending}
            title="Delete goal"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        {goal.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{goal.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Progress</span>
            <span className="font-bold text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
          <span className="flex items-center gap-1">
            <FolderKanban className="size-3" />
            {goal.totalTasks} total tasks
          </span>
          <span>{goal.doneTasks} completed</span>
        </div>
      </CardContent>
    </Card>
  );
}
