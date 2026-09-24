/**
 * Shared enums and defaults. Single source of truth for values that appear in
 * the database schema, Zod schemas and the UI.
 */

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";
export const RTL_LOCALES: readonly Locale[] = ["ar"];

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const GOAL_HORIZONS = ["life", "annual", "quarterly", "monthly"] as const;
export type GoalHorizon = (typeof GOAL_HORIZONS)[number];

export const GOAL_STATUSES = ["draft", "active", "achieved", "abandoned", "paused"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const METRIC_TYPES = ["percent", "number", "boolean"] as const;
export type MetricType = (typeof METRIC_TYPES)[number];

export const PROJECT_STATUSES = ["backlog", "active", "on_hold", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = ["inbox", "todo", "in_progress", "done", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const ENERGY_LEVELS = ["low", "medium", "high"] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const EISENHOWER_QUADRANTS = ["q1", "q2", "q3", "q4"] as const;
export type EisenhowerQuadrant = (typeof EISENHOWER_QUADRANTS)[number];

export const HABIT_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

export const HABIT_VALUE_TYPES = ["boolean", "count", "duration", "pages"] as const;
export type HabitValueType = (typeof HABIT_VALUE_TYPES)[number];

export const HABIT_CATEGORY_KINDS = ["general", "spiritual"] as const;
export type HabitCategoryKind = (typeof HABIT_CATEGORY_KINDS)[number];

/** Built-in habit presets that unlock a specialised logging UI. */
export const HABIT_PRESETS = ["prayers", "quran", "adhkar"] as const;
export type HabitPreset = (typeof HABIT_PRESETS)[number];

/** The five daily prayers, in order. Keys are used in `habit_logs.metadata`. */
export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type Prayer = (typeof PRAYERS)[number];

export const PRAYER_STATUSES = ["jamaah", "on_time", "late", "missed"] as const;
export type PrayerStatus = (typeof PRAYER_STATUSES)[number];

export const REVIEW_TYPES = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

/** Derived project health used by the dashboard (see engines/analytics.ts). */
export const PROJECT_HEALTHS = ["completed", "on_track", "at_risk", "overdue", "inactive"] as const;
export type ProjectHealth = (typeof PROJECT_HEALTHS)[number];

export const TEMPLATE_TYPES = [
  "daily_review",
  "weekly_review",
  "monthly_review",
  "quarterly_review",
  "yearly_review",
  "daily_plan",
  "project",
  "goal",
  "journal",
  "learning_plan",
] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

/** Rating scale used across importance / urgency / impact / difficulty / energy. */
export const RATING_MIN = 1;
export const RATING_MAX = 5;

/**
 * Default weights for the rule-based priority engine.
 * Sum = 1.0 so the resulting score stays in the 1..5 range.
 * See docs/architecture.md §10.
 */
export const DEFAULT_PRIORITY_WEIGHTS = {
  importance: 0.25,
  urgency: 0.2,
  impact: 0.2,
  goalContribution: 0.2,
  ease: 0.05,
  energyFit: 0.1,
} as const;

export type PriorityWeights = { [K in keyof typeof DEFAULT_PRIORITY_WEIGHTS]: number };

/** Default day the week starts on (0 = Sunday … 6 = Saturday). */
export const DEFAULT_WEEK_STARTS_ON = 6;
export const DEFAULT_TIMEZONE = "Africa/Cairo";

export const RESOURCE_TYPES = ["book", "course", "article", "podcast", "video"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_STATUSES = ["queued", "in_progress", "completed", "abandoned"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const NOTE_CATEGORIES = [
  "idea",
  "concept",
  "meeting",
  "summary",
  "journal",
  "general",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export const TIME_SESSION_MODES = ["pomodoro", "deep_work", "flowtime", "manual"] as const;
export type TimeSessionMode = (typeof TIME_SESSION_MODES)[number];
