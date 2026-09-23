import { z } from "zod";
import { ENERGY_LEVELS, TASK_STATUSES } from "../constants";
import {
  descriptionSchema,
  isoDateSchema,
  isoTimeSchema,
  ratingSchema,
  sortOrderSchema,
  titleSchema,
  uuidSchema,
} from "./common";

export const createTaskSchema = z.object({
  projectId: uuidSchema.nullable().optional(),
  goalId: uuidSchema.nullable().optional(),
  parentTaskId: uuidSchema.nullable().optional(),
  title: titleSchema,
  description: descriptionSchema.optional(),
  status: z.enum(TASK_STATUSES).default("todo"),
  importance: ratingSchema.default(3),
  /** When omitted the engine derives urgency from `dueDate`. */
  urgency: ratingSchema.nullable().optional(),
  impact: ratingSchema.default(3),
  difficulty: ratingSchema.default(3),
  energy: z.enum(ENERGY_LEVELS).default("medium"),
  estimateMinutes: z.number().int().positive().max(24 * 60).nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
  dueTime: isoTimeSchema.nullable().optional(),
  scheduledDate: isoDateSchema.nullable().optional(),
  recurrenceRule: z.string().max(500).nullable().optional(),
  sortOrder: sortOrderSchema.default(0),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const TASK_VIEWS = ["today", "inbox", "upcoming", "all"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export const listTasksQuerySchema = z.object({
  view: z.enum(TASK_VIEWS).default("all"),
  projectId: uuidSchema.optional(),
  goalId: uuidSchema.optional(),
  status: z.enum(TASK_STATUSES).optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export const recommendationsQuerySchema = z.object({
  availableMinutes: z.coerce.number().int().positive().optional(),
  energy: z.enum(ENERGY_LEVELS).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});
export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
