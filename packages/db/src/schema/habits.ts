import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  time,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { ownedColumns, ownerPolicy } from "./_shared";
import { goals } from "./hierarchy";

export const habitCategories = pgTable(
  "habit_categories",
  {
    ...ownedColumns,
    name: text("name").notNull(),
    kind: text("kind").notNull().default("general"),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("habit_categories_user_idx").on(t.userId, t.deletedAt),
    ownerPolicy("habit_categories", t.userId),
  ],
).enableRLS();

export const habits = pgTable(
  "habits",
  {
    ...ownedColumns,
    categoryId: uuid("category_id").references(() => habitCategories.id, { onDelete: "set null" }),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    frequency: text("frequency").notNull(),
    targetCount: integer("target_count").notNull().default(1),
    daysOfWeek: smallint("days_of_week").array(),
    valueType: text("value_type").notNull().default("boolean"),
    targetValue: numeric("target_value"),
    difficulty: smallint("difficulty").notNull().default(3),
    impactScore: smallint("impact_score").notNull().default(3),
    reminderTime: time("reminder_time"),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    preset: text("preset"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("habits_user_idx").on(t.userId, t.deletedAt), ownerPolicy("habits", t.userId)],
).enableRLS();

export const habitLogs = pgTable(
  "habit_logs",
  {
    ...ownedColumns,
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    logDate: date("log_date").notNull(),
    value: numeric("value").notNull().default("1"),
    completed: boolean("completed").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    note: text("note"),
  },
  (t) => [
    uniqueIndex("habit_logs_habit_date_uq").on(t.habitId, t.logDate),
    index("habit_logs_user_date_idx").on(t.userId, t.logDate),
    ownerPolicy("habit_logs", t.userId),
  ],
).enableRLS();

export type HabitCategory = typeof habitCategories.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
