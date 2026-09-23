import {
  DEFAULT_PRIORITY_WEIGHTS,
  RATING_MAX,
  RATING_MIN,
  type EisenhowerQuadrant,
  type EnergyLevel,
  type PriorityWeights,
} from "../constants";
import { daysBetween } from "./dates";

/** The subset of a task the engine needs. Ratings are 1..5. */
export interface PriorityInput {
  importance: number;
  /** Explicit urgency overrides the due-date derivation when provided. */
  urgency?: number | null;
  impact: number;
  difficulty: number;
  energy: EnergyLevel;
  dueDate?: string | null;
  /** Priority (1..5) of the linked active goal; null/undefined when unlinked. */
  goalPriority?: number | null;
}

export interface PriorityContext {
  /** ISO date used to derive urgency from `dueDate`. */
  today: string;
  /** User's current energy (1..5) from the latest daily review, if known. */
  userEnergy?: number | null;
  weights?: PriorityWeights;
}

export interface PriorityResult {
  score: number;
  urgency: number;
  goalContribution: number;
  energyFit: number;
  quadrant: EisenhowerQuadrant;
}

function clampRating(value: number): number {
  if (Number.isNaN(value)) return RATING_MIN;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value)));
}

/**
 * Urgency derived from the due date:
 * overdue or due within 1 day → 5, <3 days → 4, <7 → 3, <30 → 2, otherwise (or no date) → 1.
 */
export function deriveUrgency(dueDate: string | null | undefined, today: string): number {
  if (!dueDate) return 1;
  const days = daysBetween(today, dueDate);
  if (days < 1) return 5;
  if (days < 3) return 4;
  if (days < 7) return 3;
  if (days < 30) return 2;
  return 1;
}

/**
 * How much completing the task moves an active goal.
 * Unlinked → 1. Linked → scales with the goal priority (1..5).
 */
export function deriveGoalContribution(goalPriority: number | null | undefined): number {
  if (goalPriority == null) return 1;
  return clampRating(goalPriority);
}

const ENERGY_AS_RATING: Record<EnergyLevel, number> = { low: 2, medium: 3, high: 4 };

/**
 * 5 when the task's energy demand matches the user's current energy,
 * degrading by 1.5 per level of distance (floor 1). Neutral (3) when unknown.
 */
export function deriveEnergyFit(taskEnergy: EnergyLevel, userEnergy: number | null | undefined) {
  if (userEnergy == null) return 3;
  const distance = Math.abs(ENERGY_AS_RATING[taskEnergy] - clampRating(userEnergy));
  return Math.max(RATING_MIN, RATING_MAX - distance * 1.5);
}

export function eisenhowerQuadrant(importance: number, urgency: number): EisenhowerQuadrant {
  const important = importance >= 4;
  const urgent = urgency >= 4;
  if (important && urgent) return "q1";
  if (important) return "q2";
  if (urgent) return "q3";
  return "q4";
}

export function computePriority(input: PriorityInput, ctx: PriorityContext): PriorityResult {
  const w = ctx.weights ?? DEFAULT_PRIORITY_WEIGHTS;
  const importance = clampRating(input.importance);
  const urgency =
    input.urgency != null ? clampRating(input.urgency) : deriveUrgency(input.dueDate, ctx.today);
  const impact = clampRating(input.impact);
  const difficulty = clampRating(input.difficulty);
  const goalContribution = deriveGoalContribution(input.goalPriority);
  const energyFit = deriveEnergyFit(input.energy, ctx.userEnergy);

  const raw =
    importance * w.importance +
    urgency * w.urgency +
    impact * w.impact +
    goalContribution * w.goalContribution +
    (RATING_MAX + 1 - difficulty) * w.ease +
    energyFit * w.energyFit;

  return {
    score: Math.round(raw * 1000) / 1000,
    urgency,
    goalContribution,
    energyFit,
    quadrant: eisenhowerQuadrant(importance, urgency),
  };
}

export interface RecommendableTask extends PriorityInput {
  id: string;
  estimateMinutes?: number | null;
}

export interface RecommendationOptions {
  availableMinutes?: number | null;
  limit?: number;
}

/**
 * "Best task to do now": ranks candidates by priority score, drops tasks that
 * don't fit in the available time (tasks without an estimate always fit).
 */
export function recommendTasks<T extends RecommendableTask>(
  tasks: readonly T[],
  ctx: PriorityContext,
  options: RecommendationOptions = {},
): Array<{ task: T; priority: PriorityResult }> {
  const limit = options.limit ?? 5;
  const available = options.availableMinutes ?? null;

  return tasks
    .filter((t) => available == null || t.estimateMinutes == null || t.estimateMinutes <= available)
    .map((task) => ({ task, priority: computePriority(task, ctx) }))
    .sort((a, b) => {
      if (b.priority.score !== a.priority.score) return b.priority.score - a.priority.score;
      // Tie-break: shorter tasks first (quick wins), then stable by id.
      const ea = a.task.estimateMinutes ?? Number.MAX_SAFE_INTEGER;
      const eb = b.task.estimateMinutes ?? Number.MAX_SAFE_INTEGER;
      if (ea !== eb) return ea - eb;
      return a.task.id.localeCompare(b.task.id);
    })
    .slice(0, limit);
}
