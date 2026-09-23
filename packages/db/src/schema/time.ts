import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { ownedColumns, ownerPolicy } from "./_shared";
import { projects, tasks } from "./hierarchy";

export const timeEntries = pgTable(
  "time_entries",
  {
    ...ownedColumns,
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes").notNull(),
    mode: text("mode").notNull().default("pomodoro"),
    notes: text("notes"),
  },
  (t) => [
    index("time_entries_user_started_idx").on(t.userId, t.startedAt),
    index("time_entries_task_idx").on(t.taskId),
    index("time_entries_project_idx").on(t.projectId),
    ownerPolicy("time_entries", t.userId),
  ],
).enableRLS();

export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
