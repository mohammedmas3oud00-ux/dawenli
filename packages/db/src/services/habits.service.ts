import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import {
  AppError,
  adhkarPerformed,
  computeStreak,
  createHabitSchema,
  logHabitSchema,
  normaliseAdhkarLog,
  normalisePrayerLog,
  normaliseQuranLog,
  prayersPerformed,
  updateHabitSchema,
  type CreateHabitInput,
  type HabitFrequency,
  type LogHabitInput,
  type UpdateHabitInput,
} from "@bawsala/core";
import type { Database } from "../client";
import {
  habitCategories,
  habitLogs,
  habits,
  profiles,
  type Habit,
  type HabitCategory,
  type HabitLog,
} from "../schema";
import { fromNumeric, owned, softDelete, toNumeric } from "./_shared";

export type HabitWithCategory = Habit & { category: HabitCategory | null };

export type HabitWithTodayStatus = HabitWithCategory & {
  loggedToday: boolean;
  todayLog: HabitLog | null;
};

export async function listHabits(
  db: Database,
  userId: string,
  options: { includeArchived?: boolean; categoryId?: string } = {},
): Promise<HabitWithCategory[]> {
  const conditions = [eq(habits.userId, userId), isNull(habits.deletedAt)];
  if (!options.includeArchived) {
    conditions.push(eq(habits.isArchived, false));
  }
  if (options.categoryId) {
    conditions.push(eq(habits.categoryId, options.categoryId));
  }

  const rows = await db
    .select({
      habit: habits,
      category: habitCategories,
    })
    .from(habits)
    .leftJoin(habitCategories, eq(habits.categoryId, habitCategories.id))
    .where(and(...conditions))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));

  return rows.map((r) => ({
    ...r.habit,
    category: r.category,
  }));
}

export async function getHabit(
  db: Database,
  userId: string,
  habitId: string,
): Promise<HabitWithCategory> {
  const [row] = await db
    .select({
      habit: habits,
      category: habitCategories,
    })
    .from(habits)
    .leftJoin(habitCategories, eq(habits.categoryId, habitCategories.id))
    .where(owned(habits.userId, habits.deletedAt, userId, habits.id, habitId));

  if (!row) {
    throw AppError.notFound(`Habit ${habitId} not found`);
  }

  return {
    ...row.habit,
    category: row.category,
  };
}

export async function createHabit(db: Database, userId: string, raw: unknown): Promise<Habit> {
  const input: CreateHabitInput = createHabitSchema.parse(raw);

  const [created] = await db
    .insert(habits)
    .values({
      userId,
      categoryId: input.categoryId ?? null,
      goalId: input.goalId ?? null,
      name: input.name,
      description: input.description ?? null,
      frequency: input.frequency,
      targetCount: input.targetCount,
      daysOfWeek: input.daysOfWeek ?? null,
      valueType: input.valueType,
      targetValue: toNumeric(input.targetValue),
      difficulty: input.difficulty,
      impactScore: input.impactScore,
      reminderTime: input.reminderTime ?? null,
      preset: input.preset ?? null,
      sortOrder: input.sortOrder,
    })
    .returning();

  return created!;
}

export async function updateHabit(
  db: Database,
  userId: string,
  habitId: string,
  raw: unknown,
): Promise<Habit> {
  const patch: UpdateHabitInput = updateHabitSchema.parse(raw);
  await getHabit(db, userId, habitId);

  const updates: Record<string, unknown> = {
    updatedAt: sql`now()`,
  };

  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.description !== undefined) updates.description = patch.description ?? null;
  if (patch.categoryId !== undefined) updates.categoryId = patch.categoryId ?? null;
  if (patch.goalId !== undefined) updates.goalId = patch.goalId ?? null;
  if (patch.frequency !== undefined) updates.frequency = patch.frequency;
  if (patch.targetCount !== undefined) updates.targetCount = patch.targetCount;
  if (patch.daysOfWeek !== undefined) updates.daysOfWeek = patch.daysOfWeek ?? null;
  if (patch.valueType !== undefined) updates.valueType = patch.valueType;
  if (patch.targetValue !== undefined) updates.targetValue = toNumeric(patch.targetValue);
  if (patch.difficulty !== undefined) updates.difficulty = patch.difficulty;
  if (patch.impactScore !== undefined) updates.impactScore = patch.impactScore;
  if (patch.reminderTime !== undefined) updates.reminderTime = patch.reminderTime ?? null;
  if (patch.preset !== undefined) updates.preset = patch.preset ?? null;
  if (patch.isArchived !== undefined) updates.isArchived = patch.isArchived;
  if (patch.sortOrder !== undefined) updates.sortOrder = patch.sortOrder;

  const [updated] = await db
    .update(habits)
    .set(updates)
    .where(owned(habits.userId, habits.deletedAt, userId, habits.id, habitId))
    .returning();

  return updated!;
}

export async function deleteHabit(db: Database, userId: string, habitId: string): Promise<void> {
  const result = await db
    .update(habits)
    .set(softDelete())
    .where(owned(habits.userId, habits.deletedAt, userId, habits.id, habitId))
    .returning({ id: habits.id });

  if (result.length === 0) {
    throw AppError.notFound(`Habit ${habitId} not found`);
  }
}

export async function logHabit(
  db: Database,
  userId: string,
  habitId: string,
  today: string,
  raw: unknown,
): Promise<{ log: HabitLog; currentStreak: number; longestStreak: number }> {
  const input: LogHabitInput = logHabitSchema.parse(raw);
  const habit = await getHabit(db, userId, habitId);

  let logValue = input.value;
  let metadata = input.metadata ?? null;

  // Handle spiritual presets
  if (habit.preset === "prayers" && metadata) {
    const normalised = normalisePrayerLog(metadata);
    logValue = prayersPerformed(normalised);
    metadata = normalised as Record<string, unknown>;
  } else if (habit.preset === "adhkar" && metadata) {
    const normalised = normaliseAdhkarLog(metadata);
    logValue = adhkarPerformed(normalised);
    metadata = normalised as Record<string, unknown>;
  } else if (habit.preset === "quran" && metadata) {
    const normalised = normaliseQuranLog(metadata, input.value);
    logValue = normalised.pagesRead;
    metadata = normalised as Record<string, unknown>;
  }

  if (logValue <= 0) {
    await db
      .delete(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.userId, userId),
          eq(habitLogs.logDate, input.date),
        ),
      );

    const allLogs = await db
      .select({
        logDate: habitLogs.logDate,
        completed: habitLogs.completed,
      })
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.userId, userId),
          isNull(habitLogs.deletedAt),
        ),
      )
      .orderBy(asc(habitLogs.logDate));

    const [profile] = await db
      .select({ weekStartsOn: profiles.weekStartsOn })
      .from(profiles)
      .where(eq(profiles.id, userId));

    const streakResult = computeStreak(
      allLogs,
      {
        frequency: habit.frequency as HabitFrequency,
        daysOfWeek: habit.daysOfWeek,
        targetCount: habit.targetCount,
      },
      {
        today,
        weekStartsOn: profile?.weekStartsOn ?? 0,
      },
    );

    await db
      .update(habits)
      .set({
        currentStreak: streakResult.current,
        longestStreak: streakResult.longest,
        updatedAt: sql`now()`,
      })
      .where(eq(habits.id, habitId));

    return {
      log: {
        id: "",
        userId,
        habitId,
        logDate: input.date,
        value: "0",
        completed: false,
        metadata: null,
        note: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      currentStreak: streakResult.current,
      longestStreak: streakResult.longest,
    };
  }

  const isCompleted = logValue >= (fromNumeric(habit.targetValue) ?? habit.targetCount ?? 1);

  // Upsert the habit log
  const [log] = await db
    .insert(habitLogs)
    .values({
      userId,
      habitId,
      logDate: input.date,
      value: toNumeric(logValue) ?? "1",
      completed: isCompleted,
      metadata: metadata,
      note: input.note ?? null,
    })
    .onConflictDoUpdate({
      target: [habitLogs.habitId, habitLogs.logDate],
      set: {
        value: toNumeric(logValue) ?? "1",
        completed: isCompleted,
        metadata: metadata,
        note: input.note ?? null,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  // Recompute streaks
  const allLogs = await db
    .select({
      logDate: habitLogs.logDate,
      completed: habitLogs.completed,
    })
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, habitId),
        eq(habitLogs.userId, userId),
        isNull(habitLogs.deletedAt),
      ),
    )
    .orderBy(asc(habitLogs.logDate));

  const [profile] = await db
    .select({ weekStartsOn: profiles.weekStartsOn })
    .from(profiles)
    .where(eq(profiles.id, userId));

  const streakResult = computeStreak(
    allLogs,
    {
      frequency: habit.frequency as HabitFrequency,
      daysOfWeek: habit.daysOfWeek,
      targetCount: habit.targetCount,
    },
    {
      today,
      weekStartsOn: profile?.weekStartsOn ?? 0,
    },
  );

  await db
    .update(habits)
    .set({
      currentStreak: streakResult.current,
      longestStreak: streakResult.longest,
      updatedAt: sql`now()`,
    })
    .where(eq(habits.id, habitId));

  return {
    log: log!,
    currentStreak: streakResult.current,
    longestStreak: streakResult.longest,
  };
}

export async function getHabitLogs(
  db: Database,
  userId: string,
  habitId: string,
  startDate?: string,
  endDate?: string,
): Promise<HabitLog[]> {
  const conditions = [
    eq(habitLogs.userId, userId),
    eq(habitLogs.habitId, habitId),
    isNull(habitLogs.deletedAt),
  ];

  if (startDate) {
    conditions.push(gte(habitLogs.logDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(habitLogs.logDate, endDate));
  }

  return db
    .select()
    .from(habitLogs)
    .where(and(...conditions))
    .orderBy(asc(habitLogs.logDate));
}

export async function getTodayHabitsStatus(
  db: Database,
  userId: string,
  today: string,
): Promise<HabitWithTodayStatus[]> {
  const allHabits = await listHabits(db, userId, { includeArchived: false });
  if (allHabits.length === 0) return [];

  const todayLogs = await db
    .select()
    .from(habitLogs)
    .where(
      and(eq(habitLogs.userId, userId), eq(habitLogs.logDate, today), isNull(habitLogs.deletedAt)),
    );

  const logMap = new Map(todayLogs.map((l) => [l.habitId, l]));

  return allHabits.map((h) => {
    const l = logMap.get(h.id) ?? null;
    return {
      ...h,
      loggedToday: l?.completed ?? false,
      todayLog: l,
    };
  });
}
