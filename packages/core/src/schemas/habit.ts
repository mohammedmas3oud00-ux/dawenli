import { z } from "zod";
import { HABIT_CATEGORY_KINDS, HABIT_FREQUENCIES, HABIT_VALUE_TYPES } from "../constants";
import {
  descriptionSchema,
  isoDateSchema,
  isoTimeSchema,
  ratingSchema,
  sortOrderSchema,
  titleSchema,
  uuidSchema,
} from "./common";

export const createHabitCategorySchema = z.object({
  name: titleSchema,
  kind: z.enum(HABIT_CATEGORY_KINDS).default("general"),
  icon: z.string().max(64).optional(),
  sortOrder: sortOrderSchema.default(0),
});
export type CreateHabitCategoryInput = z.infer<typeof createHabitCategorySchema>;

export const createHabitSchema = z.object({
  categoryId: uuidSchema.nullable().optional(),
  goalId: uuidSchema.nullable().optional(),
  name: titleSchema,
  description: descriptionSchema.optional(),
  frequency: z.enum(HABIT_FREQUENCIES),
  targetCount: z.number().int().min(1).max(100).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).nullable().optional(),
  valueType: z.enum(HABIT_VALUE_TYPES).default("boolean"),
  targetValue: z.number().positive().nullable().optional(),
  difficulty: ratingSchema.default(3),
  impactScore: ratingSchema.default(3),
  reminderTime: isoTimeSchema.nullable().optional(),
  preset: z.string().max(32).nullable().optional(),
  sortOrder: sortOrderSchema.default(0),
});
export type CreateHabitInput = z.infer<typeof createHabitSchema>;

export const updateHabitSchema = createHabitSchema.partial().extend({
  isArchived: z.boolean().optional(),
});
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const logHabitSchema = z.object({
  date: isoDateSchema,
  value: z.number().min(0).default(1),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});
export type LogHabitInput = z.infer<typeof logHabitSchema>;
