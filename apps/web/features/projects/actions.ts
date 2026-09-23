"use server";

import { revalidatePath } from "next/cache";
import { createProject, deleteProject } from "@bawsala/db";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function createProjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = formData.get("title")?.toString()?.trim();
  const description = formData.get("description")?.toString()?.trim();
  const dueDate = formData.get("dueDate")?.toString() || undefined;

  if (!title) return;

  await createProject(db(), user.id, {
    title,
    description: description || undefined,
    dueDate,
    status: "active",
  });

  revalidatePath("/[locale]/projects", "page");
  revalidatePath("/[locale]/dashboard", "page");
}

export async function deleteProjectAction(projectId: string) {
  const user = await requireUser();
  await deleteProject(db(), user.id, projectId);

  revalidatePath("/[locale]/projects", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}
