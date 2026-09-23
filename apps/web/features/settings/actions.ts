"use server";

import { updateProfileSchema } from "@bawsala/core";
import { updateProfile } from "@bawsala/db";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const formSchema = updateProfileSchema.pick({
  displayName: true,
  timezone: true,
  weekStartsOn: true,
  locale: true,
  theme: true,
});

export async function saveProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const tc = await getTranslations("common");
  const user = await requireUser();

  const parsed = formSchema.safeParse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
    weekStartsOn: Number(formData.get("weekStartsOn")),
    locale: formData.get("locale"),
    theme: formData.get("theme"),
  });
  if (!parsed.success) {
    return { status: "error", message: tc("error"), fieldErrors: flatten(parsed.error) };
  }
  if (!isValidTimeZone(parsed.data.timezone)) {
    return { status: "error", message: tc("error"), fieldErrors: { timezone: ["invalid"] } };
  }

  await updateProfile(db(), user.id, parsed.data);

  const currentLocale = await getLocale();
  revalidatePath(`/${currentLocale}`, "layout");

  // Switching language moves the user to the matching URL prefix.
  if (parsed.data.locale && parsed.data.locale !== currentLocale) {
    redirect({ href: "/settings", locale: parsed.data.locale });
  }
  return { status: "success", message: tc("saved") };
}

function flatten(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function isValidTimeZone(tz: string | undefined): boolean {
  if (!tz) return true;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
