import { listProjects, type ProjectWithProgress } from "@bawsala/db";
import type { ProjectStatus } from "@bawsala/core";
import { db } from "@/lib/db";
import { getProfileForUser } from "@/features/settings/queries";
import type { CurrentUser } from "@/lib/auth";

export async function getProjectsForUser(
  user: CurrentUser,
  status?: ProjectStatus,
): Promise<ProjectWithProgress[]> {
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return listProjects(db(), user.id, today, { status });
}
