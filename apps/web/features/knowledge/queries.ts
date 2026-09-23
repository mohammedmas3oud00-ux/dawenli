import {
  listNotes,
  listResources,
  listTags,
  type Note,
  type Resource,
  type Tag,
} from "@bawsala/db";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";

export async function getNotesForUser(
  user: CurrentUser,
  options: { category?: string; search?: string } = {},
): Promise<Note[]> {
  return listNotes(db(), user.id, options);
}

export async function getResourcesForUser(
  user: CurrentUser,
  options: { type?: string; status?: string } = {},
): Promise<Resource[]> {
  return listResources(db(), user.id, options);
}

export async function getTagsForUser(user: CurrentUser): Promise<Tag[]> {
  return listTags(db(), user.id);
}
