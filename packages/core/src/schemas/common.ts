import { z } from "zod";
import { RATING_MAX, RATING_MIN } from "../constants";

export const uuidSchema = z.uuid();

/** ISO calendar date, e.g. "2026-09-23". */
export const isoDateSchema = z.iso.date();

/** "HH:MM" or "HH:MM:SS" (24h). */
export const isoTimeSchema = z.iso.time({ precision: -1 });

export const ratingSchema = z.number().int().min(RATING_MIN).max(RATING_MAX);

export const percentSchema = z.number().min(0).max(100);

export const titleSchema = z.string().trim().min(1).max(200);

export const descriptionSchema = z.string().trim().max(5000);

export const sortOrderSchema = z.number().int();

/** Reusable pagination query. */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type Pagination = z.infer<typeof paginationSchema>;
