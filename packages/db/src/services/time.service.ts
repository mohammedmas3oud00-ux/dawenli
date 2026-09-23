import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { AppError, logTimeEntrySchema, type LogTimeEntryInput } from "@bawsala/core";
import type { Database } from "../client";
import { projects, tasks, timeEntries, type TimeEntry } from "../schema";
import { owned, softDelete } from "./_shared";

export async function logTimeEntry(
  db: Database,
  userId: string,
  raw: unknown,
): Promise<TimeEntry> {
  const input: LogTimeEntryInput = logTimeEntrySchema.parse(raw);

  // If taskId provided but projectId omitted, lookup project from task
  let projectId = input.projectId ?? null;
  if (input.taskId && !projectId) {
    const [t] = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(owned(tasks.userId, tasks.deletedAt, userId, tasks.id, input.taskId));
    if (t?.projectId) {
      projectId = t.projectId;
    }
  }

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId,
      taskId: input.taskId ?? null,
      projectId,
      durationMinutes: input.durationMinutes,
      mode: input.mode,
      startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
      endedAt: input.endedAt ? new Date(input.endedAt) : new Date(),
      notes: input.notes ?? null,
    })
    .returning();

  if (!entry) {
    throw AppError.internal("Failed to create time entry");
  }

  // If taskId provided, atomically accumulate actualMinutes on the task
  if (input.taskId) {
    await db
      .update(tasks)
      .set({
        actualMinutes: sql`coalesce(${tasks.actualMinutes}, 0) + ${input.durationMinutes}`,
      })
      .where(owned(tasks.userId, tasks.deletedAt, userId, tasks.id, input.taskId));
  }

  return entry;
}

export async function listTimeEntries(
  db: Database,
  userId: string,
  options: {
    startDate?: string;
    endDate?: string;
    taskId?: string;
    projectId?: string;
    limit?: number;
  } = {},
): Promise<TimeEntry[]> {
  const conditions = [eq(timeEntries.userId, userId), isNull(timeEntries.deletedAt)];

  if (options.taskId) {
    conditions.push(eq(timeEntries.taskId, options.taskId));
  }
  if (options.projectId) {
    conditions.push(eq(timeEntries.projectId, options.projectId));
  }
  if (options.startDate) {
    conditions.push(gte(timeEntries.startedAt, new Date(options.startDate)));
  }
  if (options.endDate) {
    conditions.push(lte(timeEntries.startedAt, new Date(options.endDate)));
  }

  return db
    .select()
    .from(timeEntries)
    .where(and(...conditions))
    .orderBy(desc(timeEntries.startedAt))
    .limit(options.limit ?? 50);
}

export async function getTimeStats(
  db: Database,
  userId: string,
  todayDate: string,
): Promise<{ todayMinutes: number; todaySessions: number }> {
  const startOfDay = new Date(`${todayDate}T00:00:00Z`);
  const endOfDay = new Date(`${todayDate}T23:59:59Z`);

  const [result] = await db
    .select({
      totalMinutes: sql<string>`coalesce(sum(${timeEntries.durationMinutes}), 0)`,
      totalCount: sql<string>`count(*)`,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        isNull(timeEntries.deletedAt),
        gte(timeEntries.startedAt, startOfDay),
        lte(timeEntries.startedAt, endOfDay),
      ),
    );

  return {
    todayMinutes: Number(result?.totalMinutes ?? 0),
    todaySessions: Number(result?.totalCount ?? 0),
  };
}
