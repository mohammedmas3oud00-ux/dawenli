import type { TaskStatus } from "../constants";

export interface ProgressSnapshot {
  /** 0..100, rounded to 2 decimals. */
  progress: number;
  totalTasks: number;
  doneTasks: number;
}

export interface TaskForProgress {
  status: TaskStatus;
  estimateMinutes?: number | null;
}

const ZERO: ProgressSnapshot = { progress: 0, totalTasks: 0, doneTasks: 0 };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function taskWeight(task: TaskForProgress): number {
  return task.estimateMinutes && task.estimateMinutes > 0 ? task.estimateMinutes : 1;
}

/**
 * Project progress = Σ(weight × done) / Σ(weight). Cancelled tasks are excluded
 * from both numerator and denominator so abandoning scope doesn't count as failure.
 */
export function computeProjectProgress(tasks: readonly TaskForProgress[]): ProgressSnapshot {
  const active = tasks.filter((t) => t.status !== "cancelled");
  if (active.length === 0) return ZERO;

  let total = 0;
  let done = 0;
  let doneCount = 0;
  for (const task of active) {
    const w = taskWeight(task);
    total += w;
    if (task.status === "done") {
      done += w;
      doneCount += 1;
    }
  }
  return {
    progress: total === 0 ? 0 : round2((100 * done) / total),
    totalTasks: active.length,
    doneTasks: doneCount,
  };
}

export interface ProjectForProgress {
  weight?: number | null;
  snapshot: ProgressSnapshot;
}

/**
 * Goal progress = weighted mean of its projects. A manual override
 * (for quantitative goals such as "read 24 books") wins when present.
 */
export function computeGoalProgress(
  projects: readonly ProjectForProgress[],
  manualProgress?: number | null,
): ProgressSnapshot {
  const totals = projects.reduce(
    (acc, p) => ({
      totalTasks: acc.totalTasks + p.snapshot.totalTasks,
      doneTasks: acc.doneTasks + p.snapshot.doneTasks,
    }),
    { totalTasks: 0, doneTasks: 0 },
  );

  if (manualProgress != null) {
    return { ...totals, progress: round2(Math.min(100, Math.max(0, manualProgress))) };
  }
  if (projects.length === 0) return ZERO;

  let weightSum = 0;
  let weighted = 0;
  for (const p of projects) {
    const w = p.weight && p.weight > 0 ? p.weight : 1;
    weightSum += w;
    weighted += w * p.snapshot.progress;
  }
  return { ...totals, progress: weightSum === 0 ? 0 : round2(weighted / weightSum) };
}

/** Vision progress = plain mean of its active goals. */
export function computeVisionProgress(goals: readonly ProgressSnapshot[]): ProgressSnapshot {
  if (goals.length === 0) return ZERO;
  const sum = goals.reduce(
    (acc, g) => ({
      progress: acc.progress + g.progress,
      totalTasks: acc.totalTasks + g.totalTasks,
      doneTasks: acc.doneTasks + g.doneTasks,
    }),
    { progress: 0, totalTasks: 0, doneTasks: 0 },
  );
  return { ...sum, progress: round2(sum.progress / goals.length) };
}

/**
 * Impact preview for the "why this task?" chain:
 * how many percentage points completing `task` adds to its project.
 */
export function taskImpactOnProject(
  task: TaskForProgress,
  siblings: readonly TaskForProgress[],
): number {
  const before = computeProjectProgress(siblings).progress;
  const after = computeProjectProgress(
    siblings.map((t) => (t === task ? { ...t, status: "done" as const } : t)),
  ).progress;
  return round2(after - before);
}
