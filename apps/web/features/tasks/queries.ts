import { getEisenhowerMatrix, getTaskRecommendations, listTasks, type Task } from "@bawsala/db";
import { db } from "@/lib/db";
import { getProfileForUser } from "@/features/settings/queries";
import type { CurrentUser } from "@/lib/auth";

export async function getTasksForUser(
  user: CurrentUser,
  view: "all" | "today" | "inbox" | "upcoming" = "all",
  projectId?: string,
): Promise<Task[]> {
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return listTasks(db(), user.id, today, {
    view,
    projectId,
  });
}

export async function getEisenhowerMatrixForUser(user: CurrentUser) {
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return getEisenhowerMatrix(db(), user.id, today);
}

export async function getTaskRecommendationsForUser(user: CurrentUser, availableMinutes?: number) {
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return getTaskRecommendations(db(), user.id, today, {
    availableMinutes,
    limit: 3,
  });
}
