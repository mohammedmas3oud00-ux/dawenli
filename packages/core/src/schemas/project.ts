import { z } from "zod";
import { PROJECT_STATUSES } from "../constants";
import {
  descriptionSchema,
  isoDateSchema,
  sortOrderSchema,
  titleSchema,
  uuidSchema,
} from "./common";

const projectBase = z.object({
  goalId: uuidSchema.nullable().optional(),
  areaId: uuidSchema.nullable().optional(),
  title: titleSchema,
  description: descriptionSchema.optional(),
  status: z.enum(PROJECT_STATUSES).default("active"),
  weight: z.number().positive().max(100).default(1),
  startDate: isoDateSchema.nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  sortOrder: sortOrderSchema.default(0),
});

function datesAreOrdered(value: { startDate?: string | null; dueDate?: string | null }) {
  if (!value.startDate || !value.dueDate) return true;
  return value.startDate <= value.dueDate;
}

export const createProjectSchema = projectBase.refine(datesAreOrdered, {
  message: "dueDate must be on or after startDate",
  path: ["dueDate"],
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = projectBase.partial().refine(datesAreOrdered, {
  message: "dueDate must be on or after startDate",
  path: ["dueDate"],
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const listProjectsQuerySchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  goalId: uuidSchema.optional(),
  areaId: uuidSchema.optional(),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
