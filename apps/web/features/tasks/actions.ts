"use server";

import { revalidatePath } from "next/cache";
import { parseQuickAdd } from "@bawsala/core";
import { createTask, deleteTask, findProjectByName, updateTask } from "@bawsala/db";
import { db } from "@/lib/db";
import { getProfileForUser } from "@/features/settings/queries";
import { requireUser } from "@/lib/auth";

export async function quickAddTaskAction(formData: FormData) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const text = formData.get("text")?.toString()?.trim();

  if (!text) return { ok: false, error: "Text is required" };

  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const parsed = parseQuickAdd(text, today);

  let projectId: string | undefined = undefined;
  if (parsed.projectName) {
    const matched = await findProjectByName(db(), user.id, parsed.projectName);
    if (matched) {
      projectId = matched.id;
    }
  }

  await createTask(db(), user.id, today, {
    title: parsed.title,
    projectId,
    dueDate: parsed.scheduledDate,
    scheduledDate: parsed.scheduledDate,
    importance: parsed.importance,
    energy: parsed.energy,
    estimateMinutes: parsed.estimateMinutes,
  });

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function toggleTaskAction(taskId: string, currentStatus: string) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const nextStatus = currentStatus === "done" ? "todo" : "done";

  await updateTask(db(), user.id, today, taskId, {
    status: nextStatus,
  });

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/projects", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function deleteTaskAction(taskId: string) {
  const user = await requireUser();
  await deleteTask(db(), user.id, taskId);

  revalidatePath("/[locale]/tasks", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/projects", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}
