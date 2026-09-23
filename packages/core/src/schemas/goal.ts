import { z } from "zod";
import { GOAL_HORIZONS, GOAL_STATUSES, METRIC_TYPES } from "../constants";
import {
  descriptionSchema,
  isoDateSchema,
  percentSchema,
  ratingSchema,
  sortOrderSchema,
  titleSchema,
  uuidSchema,
} from "./common";

const goalBase = z.object({
  visionId: uuidSchema.nullable().optional(),
  areaId: uuidSchema.nullable().optional(),
  parentId: uuidSchema.nullable().optional(),
  title: titleSchema,
  description: descriptionSchema.optional(),
  horizon: z.enum(GOAL_HORIZONS),
  periodStart: isoDateSchema.nullable().optional(),
  periodEnd: isoDateSchema.nullable().optional(),
  status: z.enum(GOAL_STATUSES).default("active"),
  priority: ratingSchema.default(3),
  metricType: z.enum(METRIC_TYPES).nullable().optional(),
  metricTarget: z.number().nullable().optional(),
  metricCurrent: z.number().nullable().optional(),
  manualProgress: percentSchema.nullable().optional(),
  sortOrder: sortOrderSchema.default(0),
});

function periodIsOrdered(value: { periodStart?: string | null; periodEnd?: string | null }) {
  if (!value.periodStart || !value.periodEnd) return true;
  return value.periodStart <= value.periodEnd;
}

export const createGoalSchema = goalBase.refine(periodIsOrdered, {
  message: "periodEnd must be on or after periodStart",
  path: ["periodEnd"],
});
export type CreateGoalInput = z.input<typeof createGoalSchema>;

export const updateGoalSchema = goalBase.partial().refine(periodIsOrdered, {
  message: "periodEnd must be on or after periodStart",
  path: ["periodEnd"],
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const listGoalsQuerySchema = z.object({
  horizon: z.enum(GOAL_HORIZONS).optional(),
  status: z.enum(GOAL_STATUSES).optional(),
  areaId: uuidSchema.optional(),
  parentId: uuidSchema.optional(),
});
export type ListGoalsQuery = z.infer<typeof listGoalsQuerySchema>;
