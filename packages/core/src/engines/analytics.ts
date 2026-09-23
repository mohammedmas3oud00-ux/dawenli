/**
 * Small, pure analytics helpers used by dashboards and review snapshots.
 */
import type { ProjectHealth, ProjectStatus } from "../constants";
import { daysBetween } from "./dates";

export interface ProjectForHealth {
  status: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
  /** 0..100 */
  progress: number;
}

/**
 * Project health:
 * - completed → completed
 * - backlog / on_hold / archived → inactive
 * - past due and not finished → overdue
 * - with a due date: progress lagging the elapsed share of the timeline by >20pts → at_risk
 * - otherwise → on_track
 */
export function projectHealth(project: ProjectForHealth, today: string): ProjectHealth {
  if (project.status === "completed") return "completed";
  if (project.status !== "active") return "inactive";
  if (project.progress >= 100) return "completed";
  if (!project.dueDate) return "on_track";
  if (project.dueDate < today) return "overdue";
  if (!project.startDate || project.startDate >= project.dueDate) return "on_track";

  const total = daysBetween(project.startDate, project.dueDate);
  const elapsed = Math.max(0, daysBetween(project.startDate, today));
  const expected = (100 * Math.min(elapsed, total)) / total;
  return project.progress < expected - 20 ? "at_risk" : "on_track";
}

/**
 * Habit score for a set of habits: mean of per-habit completion rates (0..100),
 * ignoring habits without any scheduled period in the range.
 */
export function habitScore(rates: readonly number[]): number {
  if (rates.length === 0) return 0;
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}

/** Percentage helper that avoids NaN on empty denominators. */
export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((100 * part) / total);
}
