"use server";

import { revalidatePath } from "next/cache";
import { createGoal, deleteGoal } from "@bawsala/db";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function createGoalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = formData.get("title")?.toString()?.trim();
  const description = formData.get("description")?.toString()?.trim();
  const rawHorizon = formData.get("horizon")?.toString();
  const horizon =
    rawHorizon === "life" || rawHorizon === "annual" || rawHorizon === "quarterly" || rawHorizon === "monthly"
      ? rawHorizon
      : "annual";
  const priority = Number(formData.get("priority") || 3);

  if (!title) return;

  await createGoal(db(), user.id, {
    title,
    description: description || undefined,
    horizon,
    priority,
  });

  revalidatePath("/[locale]/goals", "page");
  revalidatePath("/[locale]/dashboard", "page");
}

export async function deleteGoalAction(goalId: string) {
  const user = await requireUser();
  await deleteGoal(db(), user.id, goalId);

  revalidatePath("/[locale]/goals", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}
