"use server";

import { ratingSchema } from "@bawsala/core";
import { setCurrentEnergy } from "@bawsala/db";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function recordEnergy(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const tc = await getTranslations("common");
  const user = await requireUser();

  const parsed = ratingSchema.safeParse(Number(formData.get("level")));
  if (!parsed.success) return { status: "error", message: tc("error") };

  await setCurrentEnergy(db(), user.id, parsed.data);
  revalidatePath(`/${await getLocale()}/today`);
  return { status: "success", message: tc("saved") };
}
