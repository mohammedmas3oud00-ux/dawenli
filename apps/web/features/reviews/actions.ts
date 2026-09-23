"use server";

import { revalidatePath } from "next/cache";
import { ratingSchema } from "@bawsala/core";
import { setCurrentEnergy, upsertReview } from "@bawsala/db";
import { db } from "@/lib/db";
import { getProfileForUser } from "@/features/settings/queries";
import { requireUser } from "@/lib/auth";

export async function submitReviewAction(formData: FormData) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const mood = Number(formData.get("mood") || 3);
  const energy = Number(formData.get("energy") || 3);
  const winsText = formData.get("wins")?.toString()?.trim() || "";
  const lessonsText = formData.get("lessons")?.toString()?.trim() || "";

  const wins = winsText ? winsText.split("\n").map((w) => w.trim()).filter(Boolean) : [];
  const lessons = lessonsText ? lessonsText.split("\n").map((l) => l.trim()).filter(Boolean) : [];

  await upsertReview(db(), user.id, {
    type: "daily",
    periodStart: today,
    periodEnd: today,
    mood,
    energy,
    wins,
    failures: [],
    lessons,
    complete: true,
  });

  // Update profile energy level so priority engine picks it up
  const rating = ratingSchema.safeParse(energy);
  if (rating.success) {
    await setCurrentEnergy(db(), user.id, rating.data);
  }

  revalidatePath("/[locale]/reviews", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}
