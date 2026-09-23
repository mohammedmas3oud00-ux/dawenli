import { z } from "zod";
import { sortOrderSchema, titleSchema } from "./common";

export const createAreaSchema = z.object({
  name: titleSchema,
  icon: z.string().max(64).optional(),
  color: z.string().max(32).optional(),
  sortOrder: sortOrderSchema.default(0),
});
export type CreateAreaInput = z.infer<typeof createAreaSchema>;

export const updateAreaSchema = createAreaSchema.partial();
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
