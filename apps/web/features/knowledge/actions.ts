"use server";

import { revalidatePath } from "next/cache";
import {
  createNote,
  createResource,
  deleteNote,
  deleteResource,
  updateResource,
} from "@bawsala/db";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function createNoteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = formData.get("title")?.toString()?.trim();
  const content = formData.get("content")?.toString()?.trim() || "";
  const rawCat = formData.get("category")?.toString();
  const validCategories = ["idea", "concept", "meeting", "summary", "journal", "general"] as const;
  const category = validCategories.find((c) => c === rawCat) || "general";

  if (!title) return;

  await createNote(db(), user.id, {
    title,
    content,
    category,
  });

  revalidatePath("/[locale]/knowledge", "page");
}

export async function deleteNoteAction(noteId: string): Promise<void> {
  const user = await requireUser();
  await deleteNote(db(), user.id, noteId);
  revalidatePath("/[locale]/knowledge", "page");
}

export async function createResourceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = formData.get("title")?.toString()?.trim();
  const rawType = formData.get("type")?.toString();
  const validTypes = ["book", "course", "article", "podcast", "video"] as const;
  const type = validTypes.find((t) => t === rawType) || "book";
  const author = formData.get("author")?.toString()?.trim() || undefined;
  const url = formData.get("url")?.toString()?.trim() || undefined;
  const rawStatus = formData.get("status")?.toString();
  const validStatuses = ["queued", "in_progress", "completed", "abandoned"] as const;
  const status = validStatuses.find((s) => s === rawStatus) || "queued";
  const rawRating = Number(formData.get("rating"));
  const rating = rawRating >= 1 && rawRating <= 5 ? rawRating : undefined;

  if (!title) return;

  await createResource(db(), user.id, {
    title,
    type,
    author,
    url,
    status,
    rating,
  });

  revalidatePath("/[locale]/knowledge", "page");
}

export async function updateResourceStatusAction(
  resourceId: string,
  status: "queued" | "in_progress" | "completed" | "abandoned",
): Promise<void> {
  const user = await requireUser();
  await updateResource(db(), user.id, resourceId, { status });
  revalidatePath("/[locale]/knowledge", "page");
}

export async function deleteResourceAction(resourceId: string): Promise<void> {
  const user = await requireUser();
  await deleteResource(db(), user.id, resourceId);
  revalidatePath("/[locale]/knowledge", "page");
}
