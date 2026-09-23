import { z } from "zod";
import { LOCALES, THEMES } from "../constants";
import { ratingSchema } from "./common";

export const priorityWeightsSchema = z.object({
  importance: z.number().min(0).max(1),
  urgency: z.number().min(0).max(1),
  impact: z.number().min(0).max(1),
  goalContribution: z.number().min(0).max(1),
  ease: z.number().min(0).max(1),
  energyFit: z.number().min(0).max(1),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  avatarUrl: z.url().nullable().optional(),
  locale: z.enum(LOCALES).optional(),
  timezone: z.string().min(1).max(64).optional(),
  theme: z.enum(THEMES).optional(),
  accentColor: z.string().min(1).max(32).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  currentEnergy: ratingSchema.nullable().optional(),
  priorityWeights: priorityWeightsSchema.nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
