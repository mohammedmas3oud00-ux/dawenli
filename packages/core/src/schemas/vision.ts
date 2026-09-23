import { z } from "zod";
import { descriptionSchema, titleSchema } from "./common";

export const createVisionSchema = z.object({
  title: titleSchema,
  statement: descriptionSchema.optional(),
  horizonYears: z.number().int().min(1).max(50).default(5),
  isActive: z.boolean().default(true),
});
export type CreateVisionInput = z.infer<typeof createVisionSchema>;

export const updateVisionSchema = createVisionSchema.partial();
export type UpdateVisionInput = z.infer<typeof updateVisionSchema>;
