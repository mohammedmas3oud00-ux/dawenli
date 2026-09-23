"use client";

import { useTransition } from "react";
import { CheckCircle2, Clock, FolderKanban, Trash2 } from "lucide-react";
import type { ProjectWithProgress } from "@bawsala/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { deleteProjectAction } from "../actions";

const HEALTH_COLORS: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  on_track: "success",
  at_risk: "warning",
  overdue: "destructive",
  completed: "secondary",
};

const HEALTH_LABELS: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  overdue: "Overdue",
  completed: "Completed",
};

export function ProjectCard({ project }: { project: ProjectWithProgress }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteProjectAction(project.id);
    });
  };

  const progressPercent = Math.round(project.progress);

  return (
    <Card className="group relative overflow-hidden shadow-xs hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={HEALTH_COLORS[project.health] || "secondary"} className="text-[10px]">
                {HEALTH_LABELS[project.health] || project.health}
              </Badge>
              {project.dueDate ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {project.dueDate}
                </span>
              ) : null}
            </div>
            <CardTitle className="text-base font-bold mt-1 truncate">{project.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            onClick={handleDelete}
            disabled={isPending}
            title="Delete project"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        {project.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Rollup Progress</span>
            <span className="font-bold text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
          <span className="flex items-center gap-1">
            <FolderKanban className="size-3" />
            {project.totalTasks} tasks
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-500" />
            {project.doneTasks} done
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
