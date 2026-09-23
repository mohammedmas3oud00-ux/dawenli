import { getTimeStats, listTimeEntries, type TimeEntry } from "@bawsala/db";
import { db } from "@/lib/db";
import { getProfileForUser } from "@/features/settings/queries";
import type { CurrentUser } from "@/lib/auth";

export async function getTimeStatsForUser(
  user: CurrentUser,
): Promise<{ todayMinutes: number; todaySessions: number }> {
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return getTimeStats(db(), user.id, today);
}

export async function getRecentTimeEntriesForUser(
  user: CurrentUser,
  limit = 10,
): Promise<TimeEntry[]> {
  return listTimeEntries(db(), user.id, { limit });
}
