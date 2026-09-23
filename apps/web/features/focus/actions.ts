"use server";

import { revalidatePath } from "next/cache";
import { logTimeEntry } from "@bawsala/db";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function saveFocusSessionAction(
  taskId: string | null,
  durationMinutes: number,
  mode: "pomodoro" | "deep" | "short_break",
  notes?: string,
) {
  const user = await requireUser();
  if (durationMinutes <= 0) return { ok: false };

  const modeMap: Record<string, "pomodoro" | "deep_work" | "flowtime"> = {
    pomodoro: "pomodoro",
    deep: "deep_work",
    short_break: "flowtime",
  };

  await logTimeEntry(db(), user.id, {
    taskId: taskId || null,
    durationMinutes,
    mode: modeMap[mode] || "pomodoro",
    notes: notes || null,
  });

  revalidatePath("/[locale]/focus", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}
