"use server";

import { revalidatePath } from "next/cache";
import type { HabitFrequency } from "@bawsala/core";
import { createHabit, deleteHabit, logHabit } from "@bawsala/db";
import { db } from "@/lib/db";
import { getProfileForUser } from "@/features/settings/queries";
import { requireUser } from "@/lib/auth";

export async function createHabitAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = formData.get("name")?.toString()?.trim();
  const rawFreq = formData.get("frequency")?.toString();
  const frequency: HabitFrequency = rawFreq === "weekly" || rawFreq === "monthly" ? rawFreq : "daily";
  const preset = formData.get("preset")?.toString() || undefined;

  if (!name) return;

  const targetCount =
    preset === "prayers" ? 5 : preset === "adhkar" ? 2 : preset === "quran" ? 4 : 1;

  await createHabit(db(), user.id, {
    name,
    frequency,
    preset,
    targetCount,
  });

  revalidatePath("/[locale]/habits", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
}

export async function logHabitAction(habitId: string, value = 1) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  await logHabit(db(), user.id, habitId, today, {
    date: today,
    value,
  });

  revalidatePath("/[locale]/habits", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function logPrayerAction(habitId: string, prayer: string, status: string, existingMetadata: Record<string, unknown> = {}) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const updatedMetadata = {
    ...existingMetadata,
    [prayer]: status,
  };

  await logHabit(db(), user.id, habitId, today, {
    date: today,
    value: 0,
    metadata: updatedMetadata,
  });

  revalidatePath("/[locale]/habits", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function logQuranAction(
  habitId: string,
  pagesRead: number,
  currentPage?: number,
  existingMetadata: Record<string, unknown> = {},
) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const updatedMetadata = {
    ...existingMetadata,
    pagesRead,
    ...(currentPage !== undefined ? { currentPage } : {}),
  };

  await logHabit(db(), user.id, habitId, today, {
    date: today,
    value: pagesRead,
    metadata: updatedMetadata,
  });

  revalidatePath("/[locale]/habits", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function logAdhkarAction(
  habitId: string,
  period: "morning" | "evening",
  completed: boolean,
  existingMetadata: Record<string, unknown> = {},
) {
  const user = await requireUser();
  const profile = await getProfileForUser(user);
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const updatedMetadata = {
    ...existingMetadata,
    [period]: completed,
  };

  const performed = (updatedMetadata.morning ? 1 : 0) + (updatedMetadata.evening ? 1 : 0);

  await logHabit(db(), user.id, habitId, today, {
    date: today,
    value: performed,
    metadata: updatedMetadata,
  });

  revalidatePath("/[locale]/habits", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function deleteHabitAction(habitId: string) {
  const user = await requireUser();
  await deleteHabit(db(), user.id, habitId);

  revalidatePath("/[locale]/habits", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function seedSpiritualHabitsAction(): Promise<void> {
  const user = await requireUser();
  await createHabit(db(), user.id, {
    name: "الصلوات الخمس",
    frequency: "daily",
    preset: "prayers",
    targetCount: 5,
  });
  await createHabit(db(), user.id, {
    name: "ورد القرآن اليومي",
    frequency: "daily",
    preset: "quran",
    targetCount: 4,
  });
  await createHabit(db(), user.id, {
    name: "أذكار الصباح والمساء",
    frequency: "daily",
    preset: "adhkar",
    targetCount: 2,
  });

  revalidatePath("/[locale]/habits", "page");
  revalidatePath("/[locale]/today", "page");
  revalidatePath("/[locale]/dashboard", "page");
}

