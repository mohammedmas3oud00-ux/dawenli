import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  AppError,
  upsertReviewSchema,
  type ReviewType,
  type UpsertReviewInput,
} from "@bawsala/core";
import type { Database } from "../client";
import { reviews, type Review } from "../schema";
import { owned, softDelete } from "./_shared";

export async function listReviews(
  db: Database,
  userId: string,
  options: { type?: ReviewType } = {},
): Promise<Review[]> {
  const conditions = [eq(reviews.userId, userId), isNull(reviews.deletedAt)];
  if (options.type) {
    conditions.push(eq(reviews.type, options.type));
  }

  return db
    .select()
    .from(reviews)
    .where(and(...conditions))
    .orderBy(desc(reviews.periodStart), desc(reviews.createdAt));
}

export async function getReview(
  db: Database,
  userId: string,
  reviewId: string,
): Promise<Review> {
  const [row] = await db
    .select()
    .from(reviews)
    .where(owned(reviews.userId, reviews.deletedAt, userId, reviews.id, reviewId));

  if (!row) {
    throw AppError.notFound(`Review ${reviewId} not found`);
  }

  return row;
}

export async function upsertReview(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<Review> {
  const input: UpsertReviewInput = upsertReviewSchema.parse(raw);

  const [existing] = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.type, input.type),
        eq(reviews.periodStart, input.periodStart),
        isNull(reviews.deletedAt),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(reviews)
      .set({
        templateId: input.templateId ?? existing.templateId,
        periodEnd: input.periodEnd,
        answers: input.answers,
        mood: input.mood ?? null,
        energy: input.energy ?? null,
        wins: input.wins,
        failures: input.failures,
        lessons: input.lessons,
        completedAt: input.complete ? sql`now()` : null,
        updatedAt: sql`now()`,
      })
      .where(eq(reviews.id, existing.id))
      .returning();

    return updated!;
  }

  const [created] = await db
    .insert(reviews)
    .values({
      userId,
      templateId: input.templateId ?? null,
      type: input.type,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      answers: input.answers,
      mood: input.mood ?? null,
      energy: input.energy ?? null,
      wins: input.wins,
      failures: input.failures,
      lessons: input.lessons,
      completedAt: input.complete ? sql`now()` : null,
    })
    .returning();

  return created!;
}

export async function deleteReview(
  db: Database,
  userId: string,
  reviewId: string,
): Promise<void> {
  const result = await db
    .update(reviews)
    .set(softDelete())
    .where(owned(reviews.userId, reviews.deletedAt, userId, reviews.id, reviewId))
    .returning({ id: reviews.id });

  if (result.length === 0) {
    throw AppError.notFound(`Review ${reviewId} not found`);
  }
}

export async function getLatestReview(
  db: Database,
  userId: string,
  type: ReviewType = "daily",
): Promise<Review | null> {
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.type, type), isNull(reviews.deletedAt)))
    .orderBy(desc(reviews.periodStart))
    .limit(1);

  return row ?? null;
}
