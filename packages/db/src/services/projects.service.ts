import { and, asc, eq, sql } from "drizzle-orm";
import {
  AppError,
  createProjectSchema,
  projectHealth,
  updateProjectSchema,
  type CreateProjectInput,
  type ListProjectsQuery,
  type ProjectHealth,
  type ProjectStatus,
  type UpdateProjectInput,
} from "@bawsala/core";
import type { Database } from "../client";
import { projects, type Project } from "../schema";
import {
  owned,
  progressMap,
  softDelete,
  toNumeric,
  ZERO_PROGRESS,
  type ProgressInfo,
} from "./_shared";

export type ProjectWithProgress = Project & ProgressInfo & { health: ProjectHealth };

async function withProgress(
  db: Database,
  userId: string,
  rows: Project[],
  today: string,
): Promise<ProjectWithProgress[]> {
  const map = await progressMap(
    db,
    userId,
    "project",
    rows.map((r) => r.id),
  );
  return rows.map((r) => {
    const p = map.get(r.id) ?? ZERO_PROGRESS;
    return {
      ...r,
      ...p,
      health: projectHealth(
        {
          status: r.status as ProjectStatus,
          startDate: r.startDate,
          dueDate: r.dueDate,
          progress: p.progress,
        },
        today,
      ),
    };
  });
}

export async function listProjects(
  db: Database,
  userId: string,
  today: string,
  query: ListProjectsQuery = {},
): Promise<ProjectWithProgress[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(
      and(
        owned(projects.userId, projects.deletedAt, userId),
        query.status ? eq(projects.status, query.status) : undefined,
        query.goalId ? eq(projects.goalId, query.goalId) : undefined,
        query.areaId ? eq(projects.areaId, query.areaId) : undefined,
      ),
    )
    .orderBy(asc(projects.sortOrder), asc(projects.createdAt));
  return withProgress(db, userId, rows, today);
}

export async function getProject(
  db: Database,
  userId: string,
  id: string,
  today: string,
): Promise<ProjectWithProgress | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(owned(projects.userId, projects.deletedAt, userId, projects.id, id))
    .limit(1);
  if (!row) return null;
  const [withP] = await withProgress(db, userId, [row], today);
  return withP ?? null;
}

function toRow(data: Partial<CreateProjectInput>) {
  const { weight, ...rest } = data;
  return { ...rest, weight: toNumeric(weight) ?? undefined };
}

export async function createProject(
  db: Database,
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const data = createProjectSchema.parse(input);
  const [row] = await db
    .insert(projects)
    .values({ ...toRow(data), userId })
    .returning();
  return row!;
}

export async function updateProject(
  db: Database,
  userId: string,
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const data = updateProjectSchema.parse(input);
  const completedAt =
    data.status === undefined
      ? {}
      : data.status === "completed"
        ? { completedAt: sql`coalesce(${projects.completedAt}, now())` }
        : { completedAt: null };
  const [row] = await db
    .update(projects)
    .set({ ...toRow(data), ...completedAt, updatedAt: sql`now()` })
    .where(owned(projects.userId, projects.deletedAt, userId, projects.id, id))
    .returning();
  if (!row) throw new AppError("NOT_FOUND", "Project not found");
  return row;
}

export async function deleteProject(db: Database, userId: string, id: string): Promise<void> {
  const [row] = await db
    .update(projects)
    .set(softDelete())
    .where(owned(projects.userId, projects.deletedAt, userId, projects.id, id))
    .returning({ id: projects.id });
  if (!row) throw new AppError("NOT_FOUND", "Project not found");
}

/** Case-insensitive lookup used by quick-add (`#name`). */
export async function findProjectByName(
  db: Database,
  userId: string,
  name: string,
): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projects)
    .where(
      and(
        owned(projects.userId, projects.deletedAt, userId),
        sql`lower(${projects.title}) = lower(${name})`,
      ),
    )
    .limit(1);
  return row ?? null;
}
