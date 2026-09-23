import { z } from "zod";
import { TIME_SESSION_MODES } from "../constants";
import { descriptionSchema, uuidSchema } from "./common";

export const logTimeEntrySchema = z.object({
  taskId: uuidSchema.nullable().optional(),
  projectId: uuidSchema.nullable().optional(),
  durationMinutes: z.number().int().positive().max(24 * 60),
  mode: z.enum(TIME_SESSION_MODES).default("pomodoro"),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  notes: descriptionSchema.optional(),
});
export type LogTimeEntryInput = z.input<typeof logTimeEntrySchema>;
