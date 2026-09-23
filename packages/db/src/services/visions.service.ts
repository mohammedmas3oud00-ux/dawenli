import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  AppError,
  createVisionSchema,
  updateVisionSchema,
  type CreateVisionInput,
  type UpdateVisionInput,
} from "@bawsala/core";
import type { Database } from "../client";
import { visions, type Vision } from "../schema";
import { owned, progressMap, softDelete, ZERO_PROGRESS, type ProgressInfo } from "./_shared";

export type VisionWithProgress = Vision & ProgressInfo;

/** The single active vision (the product has one "north star" per user). */
export async function getActiveVision(db: Database, userId: string): Promise<VisionWithProgress | null> {
  const [row] = await db
    .select()
    .from(visions)
    .where(and(owned(visions.userId, visions.deletedAt, userId), eq(visions.isActive, true)))
    .orderBy(desc(visions.updatedAt))
    .limit(1);
  if (!row) return null;
  const progress = await progressMap(db, userId, "vision", [row.id]);
  return { ...row, ...(progress.get(row.id) ?? ZERO_PROGRESS) };
}

export async function getVision(db: Database, userId: string, id: string): Promise<Vision | null> {
  const [row] = await db
    .select()
    .from(visions)
    .where(owned(visions.userId, visions.deletedAt, userId, visions.id, id))
    .limit(1);
  return row ?? null;
}

export async function createVision(db: Database, userId: string, input: CreateVisionInput): Promise<Vision> {
  const data = createVisionSchema.parse(input);
  if (data.isActive) await deactivateOthers(db, userId);
  const [row] = await db.insert(visions).values({ ...data, userId }).returning();
  return row!;
}

export async function updateVision(
  db: Database,
  userId: string,
  id: string,
  input: UpdateVisionInput,
): Promise<Vision> {
  const data = updateVisionSchema.parse(input);
  if (data.isActive === true) await deactivateOthers(db, userId, id);
  const [row] = await db
    .update(visions)
    .set({ ...data, updatedAt: sql`now()` })
    .where(owned(visions.userId, visions.deletedAt, userId, visions.id, id))
    .returning();
  if (!row) throw new AppError("NOT_FOUND", "Vision not found");
  return row;
}

/** Creates the active vision when none exists, otherwise updates it. */
export async function upsertActiveVision(
  db: Database,
  userId: string,
  input: CreateVisionInput,
): Promise<Vision> {
  const current = await getActiveVision(db, userId);
  if (current) return updateVision(db, userId, current.id, input);
  return createVision(db, userId, { ...input, isActive: true });
}

export async function deleteVision(db: Database, userId: string, id: string): Promise<void> {
  const [row] = await db
    .update(visions)
    .set(softDelete())
    .where(owned(visions.userId, visions.deletedAt, userId, visions.id, id))
    .returning({ id: visions.id });
  if (!row) throw new AppError("NOT_FOUND", "Vision not found");
}

async function deactivateOthers(db: Database, userId: string, exceptId?: string) {
  await db
    .update(visions)
    .set({ isActive: false, updatedAt: sql`now()` })
    .where(
      and(
        eq(visions.userId, userId),
        isNull(visions.deletedAt),
        eq(visions.isActive, true),
        exceptId ? sql`${visions.id} <> ${exceptId}` : undefined,
      ),
    );
}
