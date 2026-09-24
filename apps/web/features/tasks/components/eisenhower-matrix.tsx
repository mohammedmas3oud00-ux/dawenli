"use client";

import type { Task } from "@bawsala/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskItem } from "./task-item";

interface EisenhowerMatrixProps {
  matrix: {
    q1: Task[];
    q2: Task[];
    q3: Task[];
    q4: Task[];
  };
}

export function EisenhowerMatrix({ matrix }: EisenhowerMatrixProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Q1: Do First */}
      <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
        <CardHeader className="pb-3 border-b border-destructive/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-destructive">
              Q1: Do First (Urgent & Important)
            </CardTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
              {matrix.q1.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Crises, deadlined projects, immediate problems
          </p>
        </CardHeader>
        <CardContent className="pt-3 flex flex-col gap-2 min-h-[140px]">
          {matrix.q1.length === 0 ? (
            <p className="text-xs text-muted-foreground italic m-auto py-6">
              No urgent & important tasks
            </p>
          ) : (
            matrix.q1.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </CardContent>
      </Card>

      {/* Q2: Schedule / Strategic */}
      <Card className="border-amber-500/30 bg-amber-500/5 shadow-xs">
        <CardHeader className="pb-3 border-b border-amber-500/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-400">
              Q2: Schedule (Important, Not Urgent)
            </CardTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {matrix.q2.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Strategic vision, deep work, health, relationships
          </p>
        </CardHeader>
        <CardContent className="pt-3 flex flex-col gap-2 min-h-[140px]">
          {matrix.q2.length === 0 ? (
            <p className="text-xs text-muted-foreground italic m-auto py-6">
              No strategic tasks scheduled
            </p>
          ) : (
            matrix.q2.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </CardContent>
      </Card>

      {/* Q3: Delegate */}
      <Card className="border-sky-500/30 bg-sky-500/5 shadow-xs">
        <CardHeader className="pb-3 border-b border-sky-500/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-sky-600 dark:text-sky-400">
              Q3: Delegate (Urgent, Not Important)
            </CardTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
              {matrix.q3.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Interruptions, low-impact urgent demands</p>
        </CardHeader>
        <CardContent className="pt-3 flex flex-col gap-2 min-h-[140px]">
          {matrix.q3.length === 0 ? (
            <p className="text-xs text-muted-foreground italic m-auto py-6">No delegation tasks</p>
          ) : (
            matrix.q3.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </CardContent>
      </Card>

      {/* Q4: Eliminate */}
      <Card className="border-muted bg-card shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-muted-foreground">
              Q4: Eliminate (Not Urgent, Not Important)
            </CardTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {matrix.q4.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Time wasters, busy work to drop or minimize
          </p>
        </CardHeader>
        <CardContent className="pt-3 flex flex-col gap-2 min-h-[140px]">
          {matrix.q4.length === 0 ? (
            <p className="text-xs text-muted-foreground italic m-auto py-6">
              Clean slate: no Q4 tasks
            </p>
          ) : (
            matrix.q4.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
