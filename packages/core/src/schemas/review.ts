import { z } from "zod";
import { REVIEW_TYPES, TEMPLATE_TYPES } from "../constants";
import { isoDateSchema, ratingSchema, titleSchema, uuidSchema } from "./common";

export const TEMPLATE_FIELD_TYPES = [
  "text",
  "textarea",
  "rating",
  "boolean",
  "list",
  "number",
] as const;

export const templateFieldSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z][a-z0-9_]*$/, "key must be snake_case")
    .max(64),
  labelAr: z.string().min(1).max(200),
  labelEn: z.string().min(1).max(200),
  type: z.enum(TEMPLATE_FIELD_TYPES),
  required: z.boolean().default(false),
});
export type TemplateField = z.infer<typeof templateFieldSchema>;

export const createTemplateSchema = z.object({
  type: z.enum(TEMPLATE_TYPES),
  name: titleSchema,
  schema: z.array(templateFieldSchema).min(1).max(50),
  isDefault: z.boolean().default(false),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const upsertReviewSchema = z.object({
  templateId: uuidSchema.nullable().optional(),
  type: z.enum(REVIEW_TYPES),
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  answers: z.record(z.string(), z.unknown()).default({}),
  mood: ratingSchema.nullable().optional(),
  energy: ratingSchema.nullable().optional(),
  wins: z.array(z.string().max(500)).max(50).default([]),
  failures: z.array(z.string().max(500)).max(50).default([]),
  lessons: z.array(z.string().max(500)).max(50).default([]),
  complete: z.boolean().default(false),
});
export type UpsertReviewInput = z.infer<typeof upsertReviewSchema>;
