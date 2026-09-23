import { and, eq, isNull, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  DEFAULT_PRIORITY_WEIGHTS,
  todayInTimezone,
  type PriorityContext,
  type PriorityWeights,
} from "@bawsala/core";
import type { Database } from "../client";
import { profiles, progressCache } from "../schema";

/** Drizzle returns `numeric` columns as strings; inputs must be strings too. */
export function toNumeric(value: number | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value);
}

export function fromNumeric(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** `user_id = $1 AND deleted_at IS NULL [AND id = $2]` — the standard owned-row filter. */
export function owned(
  userIdColumn: AnyPgColumn,
  deletedAtColumn: AnyPgColumn,
  userId: string,
  idColumn?: AnyPgColumn,
  id?: string,
): SQL {
  const parts = [eq(userIdColumn, userId), isNull(deletedAtColumn)];
  if (idColumn && id !== undefined) parts.push(eq(idColumn, id));
  return and(...parts)!;
}

export const softDelete = () => ({ deletedAt: sql`now()`, updatedAt: sql`now()` });

export interface ProgressInfo {
  progress: number;
  totalTasks: number;
  doneTasks: number;
}

/** Reads rollup rows for many entities at once (missing entries → zero). */
export async function progressMap(
  db: Database,
  userId: string,
  entityType: "project" | "goal" | "vision",
  ids: readonly string[],
): Promise<Map<string, ProgressInfo>> {
  const map = new Map<string, ProgressInfo>();
  if (ids.length === 0) return map;
  const rows = await db
    .select()
    .from(progressCache)
    .where(and(eq(progressCache.userId, userId), eq(progressCache.entityType, entityType)));
  const wanted = new Set(ids);
  for (const row of rows) {
    if (!wanted.has(row.entityId)) continue;
    map.set(row.entityId, {
      progress: fromNumeric(row.progress) ?? 0,
      totalTasks: row.totalTasks,
      doneTasks: row.doneTasks,
    });
  }
  return map;
}

export const ZERO_PROGRESS: ProgressInfo = { progress: 0, totalTasks: 0, doneTasks: 0 };

export interface UserContext extends PriorityContext {
  userId: string;
  timezone: string;
  weekStartsOn: number;
  weights: PriorityWeights;
}

/**
 * Everything the engines need about the current user: local "today",
 * current energy, configured priority weights. Falls back to defaults when
 * the profile row is missing (it is normally created by trigger).
 */
export async function loadUserContext(
  db: Database,
  userId: string,
  now: Date = new Date(),
): Promise<UserContext> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  const timezone = profile?.timezone ?? "Africa/Cairo";
  return {
    userId,
    timezone,
    today: todayInTimezone(now, timezone),
    userEnergy: profile?.currentEnergy ?? null,
    weights: profile?.priorityWeights ?? DEFAULT_PRIORITY_WEIGHTS,
    weekStartsOn: profile?.weekStartsOn ?? 6,
  };
}
