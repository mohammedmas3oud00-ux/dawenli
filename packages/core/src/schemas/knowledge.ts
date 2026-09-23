import { z } from "zod";
import { NOTE_CATEGORIES, RESOURCE_STATUSES, RESOURCE_TYPES } from "../constants";
import { descriptionSchema, ratingSchema, titleSchema, uuidSchema } from "./common";

export const createNoteSchema = z.object({
  projectId: uuidSchema.nullable().optional(),
  title: titleSchema,
  content: z.string().max(50_000).default(""),
  category: z.enum(NOTE_CATEGORIES).default("general"),
});
export type CreateNoteInput = z.input<typeof createNoteSchema>;

export const updateNoteSchema = createNoteSchema.partial();
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const createResourceSchema = z.object({
  title: titleSchema,
  type: z.enum(RESOURCE_TYPES).default("book"),
  author: z.string().max(200).nullable().optional(),
  url: z.string().url().max(1000).nullable().optional().or(z.literal("")),
  status: z.enum(RESOURCE_STATUSES).default("queued"),
  rating: ratingSchema.nullable().optional(),
  notes: descriptionSchema.optional(),
});
export type CreateResourceInput = z.input<typeof createResourceSchema>;

export const updateResourceSchema = createResourceSchema.partial();
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z.string().max(20).default("indigo"),
});
export type CreateTagInput = z.input<typeof createTagSchema>;
