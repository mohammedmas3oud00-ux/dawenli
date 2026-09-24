"use client";

import { useRef, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { quickAddTaskAction } from "../actions";

export function QuickAddTask() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    startTransition(async () => {
      await quickAddTaskAction(formData);
      form.reset();
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Input
          name="text"
          placeholder="Quick add: 'Write proposal #Launch !p1 @tomorrow ~45m ^high'"
          disabled={isPending}
          className="flex-1 bg-card shadow-xs"
          required
        />
        <Button type="submit" disabled={isPending} className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          <span>Add Task</span>
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground px-1">
        Syntax: <code className="bg-muted px-1 rounded">@today | @tomorrow | @fri</code> for dates,{" "}
        <code className="bg-muted px-1 rounded">!p1..!p5</code> for priority,{" "}
        <code className="bg-muted px-1 rounded">#project</code> for project,{" "}
        <code className="bg-muted px-1 rounded">~45m</code> for duration,{" "}
        <code className="bg-muted px-1 rounded">^high</code> for energy.
      </p>
    </form>
  );
}
