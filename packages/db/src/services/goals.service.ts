import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  AppError,
  createGoalSchema,
  updateGoalSchema,
  type CreateGoalInput,
  type ListGoalsQuery,
  type UpdateGoalInput,
} from "@bawsala/core";
import type { Database } from "../client";
import { goals, type Goal } from "../schema";
import {
  owned,
  progressMap,
  softDelete,
  toNumeric,
  ZERO_PROGRESS,
  type ProgressInfo,
} from "./_shared";

export type GoalWithProgress = Goal & ProgressInfo;

async function withProgress(db: Database, userId: string, rows: Goal[]): Promise<GoalWithProgress[]> {
  const map = await progressMap(
    db,
    userId,
    "goal",
    rows.map((r) => r.id),
  );
  return rows.map((r) => ({ ...r, ...(map.get(r.id) ?? ZERO_PROGRESS) }));
}

export async function listGoals(
  db: Database,
  userId: string,
  query: ListGoalsQuery = {},
): Promise<GoalWithProgress[]> {
  const rows = await db
    .select()
    .from(goals)
    .where(
      and(
        owned(goals.userId, goals.deletedAt, userId),
        query.horizon ? eq(goals.horizon, query.horizon) : undefined,
        query.status ? eq(goals.status, query.status) : undefined,
        query.areaId ? eq(goals.areaId, query.areaId) : undefined,
        query.parentId ? eq(goals.parentId, query.parentId) : undefined,
      ),
    )
    .orderBy(asc(goals.sortOrder), desc(goals.priority), asc(goals.createdAt));
  return withProgress(db, userId, rows);
}

export async function getGoal(db: Database, userId: string, id: string): Promise<GoalWithProgress | null> {
  const [row] = await db
    .select()
    .from(goals)
    .where(owned(goals.userId, goals.deletedAt, userId, goals.id, id))
    .limit(1);
  if (!row) return null;
  const [withP] = await withProgress(db, userId, [row]);
  return withP ?? null;
}

function toRow(data: Partial<CreateGoalInput>) {
  const { metricTarget, metricCurrent, manualProgress, ...rest } = data;
  return {
    ...rest,
    metricTarget: toNumeric(metricTarget),
    metricCurrent: toNumeric(metricCurrent),
    manualProgress: toNumeric(manualProgress),
  };
}

export async function createGoal(db: Database, userId: string, input: CreateGoalInput): Promise<Goal> {
  const data = createGoalSchema.parse(input);
  if (data.parentId) await assertOwnedGoal(db, userId, data.parentId);
  const { metricTarget, metricCurrent, manualProgress, ...rest } = data;
  const [row] = await db
    .insert(goals)
    .values({
      ...rest,
      userId,
      metricTarget: toNumeric(metricTarget),
      metricCurrent: toNumeric(metricCurrent),
      manualProgress: toNumeric(manualProgress),
    })
    .returning();
  return row!;
}

export async function updateGoal(
  db: Database,
  userId: string,
  id: string,
  input: UpdateGoalInput,
): Promise<Goal> {
  const data = updateGoalSchema.parse(input);
  if (data.parentId) {
    if (data.parentId === id) throw new AppError("VALIDATION_FAILED", "A goal cannot be its own parent");
    await assertOwnedGoal(db, userId, data.parentId);
  }
  const [row] = await db
    .update(goals)
    .set({ ...toRow(data), updatedAt: sql`now()` })
    .where(owned(goals.userId, goals.deletedAt, userId, goals.id, id))
    .returning();
  if (!row) throw new AppError("NOT_FOUND", "Goal not found");
  return row;
}

export async function deleteGoal(db: Database, userId: string, id: string): Promise<void> {
  const [row] = await db
    .update(goals)
    .set(softDelete())
    .where(owned(goals.userId, goals.deletedAt, userId, goals.id, id))
    .returning({ id: goals.id });
  if (!row) throw new AppError("NOT_FOUND", "Goal not found");
}

async function assertOwnedGoal(db: Database, userId: string, id: string) {
  const [row] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(owned(goals.userId, goals.deletedAt, userId, goals.id, id))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Parent goal not found");
}

/** Goals grouped by horizon for the hierarchy view (life → annual → quarterly → monthly). */
export interface GoalTreeNode extends GoalWithProgress {
  children: GoalTreeNode[];
}

export function buildGoalTree(rows: readonly GoalWithProgress[]): GoalTreeNode[] {
  const nodes = new Map<string, GoalTreeNode>();
  for (const r of rows) nodes.set(r.id, { ...r, children: [] });
  const roots: GoalTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
