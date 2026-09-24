import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import {
  AppError,
  createNoteSchema,
  createResourceSchema,
  createTagSchema,
  updateNoteSchema,
  updateResourceSchema,
  type CreateNoteInput,
  type CreateResourceInput,
  type CreateTagInput,
  type UpdateNoteInput,
  type UpdateResourceInput,
} from "@bawsala/core";
import type { Database } from "../client";
import { notes, resources, tags, type Note, type Resource, type Tag } from "../schema";
import { owned, softDelete } from "./_shared";

/* =========================================================================
 * Notes Operations
 * ========================================================================= */

export async function listNotes(
  db: Database,
  userId: string,
  options: { projectId?: string; category?: string; search?: string } = {},
): Promise<Note[]> {
  const conditions = [eq(notes.userId, userId), isNull(notes.deletedAt)];

  if (options.projectId) {
    conditions.push(eq(notes.projectId, options.projectId));
  }
  if (options.category) {
    conditions.push(eq(notes.category, options.category));
  }
  if (options.search) {
    conditions.push(ilike(notes.title, `%${options.search}%`));
  }

  return db
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt));
}

export async function getNote(db: Database, userId: string, noteId: string): Promise<Note> {
  const [row] = await db
    .select()
    .from(notes)
    .where(owned(notes.userId, notes.deletedAt, userId, notes.id, noteId));

  if (!row) {
    throw AppError.notFound(`Note ${noteId} not found`);
  }

  return row;
}

export async function createNote(db: Database, userId: string, raw: unknown): Promise<Note> {
  const input: CreateNoteInput = createNoteSchema.parse(raw);

  const [created] = await db
    .insert(notes)
    .values({
      userId,
      projectId: input.projectId ?? null,
      title: input.title,
      content: input.content ?? "",
      category: input.category ?? "general",
    })
    .returning();

  if (!created) {
    throw AppError.internal("Failed to create note");
  }

  return created;
}

export async function updateNote(
  db: Database,
  userId: string,
  noteId: string,
  raw: unknown,
): Promise<Note> {
  const input: UpdateNoteInput = updateNoteSchema.parse(raw);

  const [updated] = await db
    .update(notes)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
    })
    .where(owned(notes.userId, notes.deletedAt, userId, notes.id, noteId))
    .returning();

  if (!updated) {
    throw AppError.notFound(`Note ${noteId} not found`);
  }

  return updated;
}

export async function deleteNote(db: Database, userId: string, noteId: string): Promise<void> {
  const result = await db
    .update(notes)
    .set(softDelete())
    .where(owned(notes.userId, notes.deletedAt, userId, notes.id, noteId))
    .returning({ id: notes.id });

  if (result.length === 0) {
    throw AppError.notFound(`Note ${noteId} not found`);
  }
}

/* =========================================================================
 * Resources Operations
 * ========================================================================= */

export async function listResources(
  db: Database,
  userId: string,
  options: { type?: string; status?: string } = {},
): Promise<Resource[]> {
  const conditions = [eq(resources.userId, userId), isNull(resources.deletedAt)];

  if (options.type) {
    conditions.push(eq(resources.type, options.type));
  }
  if (options.status) {
    conditions.push(eq(resources.status, options.status));
  }

  return db
    .select()
    .from(resources)
    .where(and(...conditions))
    .orderBy(desc(resources.createdAt));
}

export async function createResource(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<Resource> {
  const input: CreateResourceInput = createResourceSchema.parse(raw);

  const [created] = await db
    .insert(resources)
    .values({
      userId,
      title: input.title,
      type: input.type ?? "book",
      author: input.author ?? null,
      url: input.url || null,
      status: input.status ?? "queued",
      rating: input.rating ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  if (!created) {
    throw AppError.internal("Failed to create resource");
  }

  return created;
}

export async function updateResource(
  db: Database,
  userId: string,
  resourceId: string,
  raw: unknown,
): Promise<Resource> {
  const input: UpdateResourceInput = updateResourceSchema.parse(raw);

  const [updated] = await db
    .update(resources)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.author !== undefined ? { author: input.author } : {}),
      ...(input.url !== undefined ? { url: input.url || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    })
    .where(owned(resources.userId, resources.deletedAt, userId, resources.id, resourceId))
    .returning();

  if (!updated) {
    throw AppError.notFound(`Resource ${resourceId} not found`);
  }

  return updated;
}

export async function deleteResource(
  db: Database,
  userId: string,
  resourceId: string,
): Promise<void> {
  const result = await db
    .update(resources)
    .set(softDelete())
    .where(owned(resources.userId, resources.deletedAt, userId, resources.id, resourceId))
    .returning({ id: resources.id });

  if (result.length === 0) {
    throw AppError.notFound(`Resource ${resourceId} not found`);
  }
}

/* =========================================================================
 * Tags Operations
 * ========================================================================= */

export async function listTags(db: Database, userId: string): Promise<Tag[]> {
  return db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), isNull(tags.deletedAt)))
    .orderBy(tags.name);
}

export async function createTag(db: Database, userId: string, raw: unknown): Promise<Tag> {
  const input: CreateTagInput = createTagSchema.parse(raw);

  const [created] = await db
    .insert(tags)
    .values({
      userId,
      name: input.name,
      color: input.color ?? "indigo",
    })
    .returning();

  if (!created) {
    throw AppError.internal("Failed to create tag");
  }

  return created;
}
