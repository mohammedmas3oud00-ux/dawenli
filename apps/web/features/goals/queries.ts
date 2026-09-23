import type { GoalHorizon } from "@bawsala/core";
import { listGoals, type GoalWithProgress } from "@bawsala/db";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";

export async function getGoalsForUser(
  user: CurrentUser,
  horizon?: GoalHorizon,
): Promise<GoalWithProgress[]> {
  return listGoals(db(), user.id, { horizon });
}
