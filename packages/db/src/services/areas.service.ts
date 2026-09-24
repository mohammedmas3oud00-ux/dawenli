import { asc, sql } from "drizzle-orm";
import {
  AppError,
  createAreaSchema,
  updateAreaSchema,
  type CreateAreaInput,
  type UpdateAreaInput,
} from "@bawsala/core";
import type { Database } from "../client";
import { areas, type Area } from "../schema";
import { owned, softDelete } from "./_shared";

export async function listAreas(db: Database, userId: string): Promise<Area[]> {
  return db
    .select()
    .from(areas)
    .where(owned(areas.userId, areas.deletedAt, userId))
    .orderBy(asc(areas.sortOrder), asc(areas.createdAt));
}

export async function getArea(db: Database, userId: string, id: string): Promise<Area | null> {
  const [row] = await db
    .select()
    .from(areas)
    .where(owned(areas.userId, areas.deletedAt, userId, areas.id, id))
    .limit(1);
  return row ?? null;
}

export async function createArea(
  db: Database,
  userId: string,
  input: CreateAreaInput,
): Promise<Area> {
  const data = createAreaSchema.parse(input);
  const [row] = await db
    .insert(areas)
    .values({ ...data, userId })
    .returning();
  return row!;
}

export async function updateArea(
  db: Database,
  userId: string,
  id: string,
  input: UpdateAreaInput,
): Promise<Area> {
  const data = updateAreaSchema.parse(input);
  const [row] = await db
    .update(areas)
    .set({ ...data, updatedAt: sql`now()` })
    .where(owned(areas.userId, areas.deletedAt, userId, areas.id, id))
    .returning();
  if (!row) throw new AppError("NOT_FOUND", "Area not found");
  return row;
}

export async function deleteArea(db: Database, userId: string, id: string): Promise<void> {
  const [row] = await db
    .update(areas)
    .set(softDelete())
    .where(owned(areas.userId, areas.deletedAt, userId, areas.id, id))
    .returning({ id: areas.id });
  if (!row) throw new AppError("NOT_FOUND", "Area not found");
}
