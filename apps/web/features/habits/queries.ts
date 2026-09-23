import { getTodayHabitsStatus, type HabitWithTodayStatus } from "@bawsala/db";
import { db } from "@/lib/db";
import { getProfileForUser } from "@/features/settings/queries";
import type { CurrentUser } from "@/lib/auth";

export async function getHabitsWithStatusForUser(user: CurrentUser): Promise<HabitWithTodayStatus[]> {
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return getTodayHabitsStatus(db(), user.id, today);
}
