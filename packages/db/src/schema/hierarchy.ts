import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { ownedColumns, ownerPolicy } from "./_shared";

export const visions = pgTable(
  "visions",
  {
    ...ownedColumns,
    title: text("title").notNull(),
    statement: text("statement"),
    horizonYears: smallint("horizon_years").notNull().default(5),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("visions_user_idx").on(t.userId, t.deletedAt), ownerPolicy("visions", t.userId)],
).enableRLS();

export const areas = pgTable(
  "areas",
  {
    ...ownedColumns,
    name: text("name").notNull(),
    icon: text("icon"),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("areas_user_idx").on(t.userId, t.deletedAt), ownerPolicy("areas", t.userId)],
).enableRLS();

export const goals = pgTable(
  "goals",
  {
    ...ownedColumns,
    visionId: uuid("vision_id").references(() => visions.id, { onDelete: "set null" }),
    areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => goals.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    horizon: text("horizon").notNull(),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    status: text("status").notNull().default("active"),
    priority: smallint("priority").notNull().default(3),
    metricType: text("metric_type"),
    metricTarget: numeric("metric_target"),
    metricCurrent: numeric("metric_current"),
    manualProgress: numeric("manual_progress"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("goals_user_idx").on(t.userId, t.deletedAt),
    index("goals_user_horizon_status_idx").on(t.userId, t.horizon, t.status),
    index("goals_parent_idx").on(t.parentId),
    ownerPolicy("goals", t.userId),
  ],
).enableRLS();

export const projects = pgTable(
  "projects",
  {
    ...ownedColumns,
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("active"),
    weight: numeric("weight").notNull().default("1"),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("projects_user_idx").on(t.userId, t.deletedAt),
    index("projects_goal_idx").on(t.goalId),
    ownerPolicy("projects", t.userId),
  ],
).enableRLS();

export const tasks = pgTable(
  "tasks",
  {
    ...ownedColumns,
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    parentTaskId: uuid("parent_task_id").references((): AnyPgColumn => tasks.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("todo"),
    importance: smallint("importance").notNull().default(3),
    urgency: smallint("urgency"),
    impact: smallint("impact").notNull().default(3),
    difficulty: smallint("difficulty").notNull().default(3),
    energy: text("energy").notNull().default("medium"),
    estimateMinutes: integer("estimate_minutes"),
    actualMinutes: integer("actual_minutes"),
    dueDate: date("due_date"),
    dueTime: time("due_time"),
    scheduledDate: date("scheduled_date"),
    priorityScore: numeric("priority_score"),
    eisenhower: text("eisenhower"),
    recurrenceRule: text("recurrence_rule"),
    recurrenceParentId: uuid("recurrence_parent_id").references((): AnyPgColumn => tasks.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("tasks_user_idx").on(t.userId, t.deletedAt),
    index("tasks_user_scheduled_idx").on(t.userId, t.scheduledDate),
    index("tasks_user_status_due_idx").on(t.userId, t.status, t.dueDate),
    index("tasks_project_idx").on(t.projectId),
    index("tasks_user_priority_idx").on(t.userId, t.priorityScore),
    ownerPolicy("tasks", t.userId),
  ],
).enableRLS();

/**
 * Bottom-up rollup cache (project / goal / vision). Maintained by triggers in
 * the functions migration; read-only for clients via RLS.
 */
export const progressCache = pgTable(
  "progress_cache",
  {
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    userId: uuid("user_id").notNull(),
    progress: numeric("progress").notNull().default("0"),
    totalTasks: integer("total_tasks").notNull().default(0),
    doneTasks: integer("done_tasks").notNull().default(0),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.entityType, t.entityId] }),
    index("progress_cache_user_idx").on(t.userId),
    ownerPolicy("progress_cache", t.userId),
  ],
).enableRLS();

export type Vision = typeof visions.$inferSelect;
export type Area = typeof areas.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ProgressCacheRow = typeof progressCache.$inferSelect;
