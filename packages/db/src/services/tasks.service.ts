import { and, asc, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import {
  AppError,
  computePriority,
  createTaskSchema,
  recommendTasks,
  updateTaskSchema,
  type EisenhowerQuadrant,
  type EnergyLevel,
  type ListTasksQuery,
  type RecommendationsQuery,
  type UpdateTaskInput,
} from "@bawsala/core";
import type { Database } from "../client";
import { goals, tasks, type Task } from "../schema";
import { owned, softDelete, toNumeric, userPriorityContext } from "./_shared";

export type TaskWithSubtasks = Task & { subtasks: Task[] };

/** Fetches the linked goal's priority (1..5) if goalId is present. */
async function getGoalPriority(db: Database, userId: string, goalId: string | null | undefined): Promise<number | null> {
  if (!goalId) return null;
  const [g] = await db
    .select({ priority: goals.priority })
    .from(goals)
    .where(owned(goals.userId, goals.deletedAt, userId, goals.id, goalId));
  return g ? g.priority : null;
}

export async function listTasks(
  db: Database,
  userId: string,
  today: string,
  query: ListTasksQuery & { eisenhower?: EisenhowerQuadrant } = { view: "all" },
): Promise<Task[]> {
  const conditions = [eq(tasks.userId, userId), isNull(tasks.deletedAt), isNull(tasks.parentTaskId)];

  if (query.projectId) {
    conditions.push(eq(tasks.projectId, query.projectId));
  }
  if (query.goalId) {
    conditions.push(eq(tasks.goalId, query.goalId));
  }
  if (query.status) {
    conditions.push(eq(tasks.status, query.status));
  }
  if (query.eisenhower) {
    conditions.push(eq(tasks.eisenhower, query.eisenhower));
  }

  // View-based filtering
  if (query.view === "today") {
    conditions.push(
      or(
        eq(tasks.scheduledDate, today),
        and(eq(tasks.dueDate, today), sql`${tasks.status} != 'done'`),
      )!,
    );
  } else if (query.view === "inbox") {
    conditions.push(isNull(tasks.projectId), isNull(tasks.goalId), sql`${tasks.status} != 'done'`);
  } else if (query.view === "upcoming") {
    conditions.push(gt(tasks.dueDate, today), sql`${tasks.status} != 'done'`);
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.priorityScore), asc(tasks.sortOrder), asc(tasks.createdAt));
}

export async function getTask(
  db: Database,
  userId: string,
  taskId: string,
): Promise<TaskWithSubtasks> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(owned(tasks.userId, tasks.deletedAt, userId, tasks.id, taskId));

  if (!task) {
    throw AppError.notFound(`Task ${taskId} not found`);
  }

  const subtasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt), eq(tasks.parentTaskId, taskId)))
    .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt));

  return { ...task, subtasks };
}

export async function createTask(
  db: Database,
  userId: string,
  today: string,
  raw: unknown,
): Promise<Task> {
  const input = createTaskSchema.parse(raw);
  const ctx = await userPriorityContext(db, userId, today);
  const goalPriority = await getGoalPriority(db, userId, input.goalId);

  const priorityResult = computePriority(
    {
      importance: input.importance,
      urgency: input.urgency,
      impact: input.impact,
      difficulty: input.difficulty,
      energy: input.energy,
      dueDate: input.dueDate,
      goalPriority,
    },
    ctx,
  );

  const [created] = await db
    .insert(tasks)
    .values({
      userId,
      projectId: input.projectId ?? null,
      goalId: input.goalId ?? null,
      parentTaskId: input.parentTaskId ?? null,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      importance: input.importance,
      urgency: priorityResult.urgency,
      impact: input.impact,
      difficulty: input.difficulty,
      energy: input.energy,
      estimateMinutes: input.estimateMinutes ?? null,
      dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null,
      scheduledDate: input.scheduledDate ?? null,
      recurrenceRule: input.recurrenceRule ?? null,
      priorityScore: toNumeric(priorityResult.score),
      eisenhower: priorityResult.quadrant,
      sortOrder: input.sortOrder,
      completedAt: input.status === "done" ? sql`now()` : null,
    })
    .returning();

  return created!;
}

export async function updateTask(
  db: Database,
  userId: string,
  today: string,
  taskId: string,
  raw: unknown,
): Promise<Task> {
  const patch: UpdateTaskInput = updateTaskSchema.parse(raw);
  const current = await getTask(db, userId, taskId);

  const mergedImportance = patch.importance ?? current.importance;
  const mergedUrgency = patch.urgency !== undefined ? patch.urgency : current.urgency;
  const mergedImpact = patch.impact ?? current.impact;
  const mergedDifficulty = patch.difficulty ?? current.difficulty;
  const mergedEnergy = patch.energy ?? (current.energy as EnergyLevel);
  const mergedDueDate = patch.dueDate !== undefined ? patch.dueDate : current.dueDate;
  const mergedGoalId = patch.goalId !== undefined ? patch.goalId : current.goalId;

  const ctx = await userPriorityContext(db, userId, today);
  const goalPriority = await getGoalPriority(db, userId, mergedGoalId);

  const priorityResult = computePriority(
    {
      importance: mergedImportance,
      urgency: mergedUrgency,
      impact: mergedImpact,
      difficulty: mergedDifficulty,
      energy: mergedEnergy,
      dueDate: mergedDueDate,
      goalPriority,
    },
    ctx,
  );

  const updates: Record<string, unknown> = {
    updatedAt: sql`now()`,
    priorityScore: toNumeric(priorityResult.score),
    eisenhower: priorityResult.quadrant,
    urgency: priorityResult.urgency,
  };

  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.description !== undefined) updates.description = patch.description ?? null;
  if (patch.projectId !== undefined) updates.projectId = patch.projectId ?? null;
  if (patch.goalId !== undefined) updates.goalId = patch.goalId ?? null;
  if (patch.parentTaskId !== undefined) updates.parentTaskId = patch.parentTaskId ?? null;
  if (patch.importance !== undefined) updates.importance = patch.importance;
  if (patch.impact !== undefined) updates.impact = patch.impact;
  if (patch.difficulty !== undefined) updates.difficulty = patch.difficulty;
  if (patch.energy !== undefined) updates.energy = patch.energy;
  if (patch.estimateMinutes !== undefined) updates.estimateMinutes = patch.estimateMinutes ?? null;
  if (patch.dueDate !== undefined) updates.dueDate = patch.dueDate ?? null;
  if (patch.dueTime !== undefined) updates.dueTime = patch.dueTime ?? null;
  if (patch.scheduledDate !== undefined) updates.scheduledDate = patch.scheduledDate ?? null;
  if (patch.recurrenceRule !== undefined) updates.recurrenceRule = patch.recurrenceRule ?? null;
  if (patch.sortOrder !== undefined) updates.sortOrder = patch.sortOrder;

  if (patch.status !== undefined) {
    updates.status = patch.status;
    if (patch.status === "done" && current.status !== "done") {
      updates.completedAt = sql`now()`;
    } else if (patch.status !== "done" && current.status === "done") {
      updates.completedAt = null;
    }
  }

  const [updated] = await db
    .update(tasks)
    .set(updates)
    .where(owned(tasks.userId, tasks.deletedAt, userId, tasks.id, taskId))
    .returning();

  return updated!;
}

export async function deleteTask(
  db: Database,
  userId: string,
  taskId: string,
): Promise<void> {
  // Soft-delete any subtasks
  await db
    .update(tasks)
    .set(softDelete())
    .where(and(eq(tasks.userId, userId), eq(tasks.parentTaskId, taskId), isNull(tasks.deletedAt)));

  const result = await db
    .update(tasks)
    .set(softDelete())
    .where(owned(tasks.userId, tasks.deletedAt, userId, tasks.id, taskId))
    .returning({ id: tasks.id });

  if (result.length === 0) {
    throw AppError.notFound(`Task ${taskId} not found`);
  }
}

export async function getEisenhowerMatrix(
  db: Database,
  userId: string,
  _today: string,
): Promise<Record<EisenhowerQuadrant, Task[]>> {
  const allActiveTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        isNull(tasks.deletedAt),
        isNull(tasks.parentTaskId),
        sql`${tasks.status} != 'done'`,
      ),
    )
    .orderBy(desc(tasks.priorityScore), asc(tasks.sortOrder));

  const matrix: Record<EisenhowerQuadrant, Task[]> = {
    q1: [],
    q2: [],
    q3: [],
    q4: [],
  };

  for (const t of allActiveTasks) {
    const q = (t.eisenhower as EisenhowerQuadrant) || "q4";
    if (matrix[q]) {
      matrix[q].push(t);
    }
  }

  return matrix;
}

export async function getTaskRecommendations(
  db: Database,
  userId: string,
  today: string,
  options: RecommendationsQuery = { limit: 5 },
): Promise<Array<{ task: Task; priority: ReturnType<typeof computePriority> }>> {
  const ctx = await userPriorityContext(db, userId, today);
  const candidates = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        isNull(tasks.deletedAt),
        isNull(tasks.parentTaskId),
        inArray(tasks.status, ["todo", "in_progress"]),
      ),
    );

  const recommendable = candidates.map((t) => ({
    id: t.id,
    importance: t.importance,
    urgency: t.urgency,
    impact: t.impact,
    difficulty: t.difficulty,
    energy: t.energy as EnergyLevel,
    estimateMinutes: t.estimateMinutes,
    dueDate: t.dueDate,
  }));

  const recommended = recommendTasks(recommendable, ctx, {
    availableMinutes: options.availableMinutes,
    limit: options.limit,
  });

  const taskMap = new Map(candidates.map((c) => [c.id, c]));
  return recommended
    .map((r) => ({
      task: taskMap.get(r.task.id)!,
      priority: r.priority,
    }))
    .filter((r) => r.task !== undefined);
}
