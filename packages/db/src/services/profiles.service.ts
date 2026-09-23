import { eq, sql } from "drizzle-orm";
import { AppError, updateProfileSchema, type Locale, type UpdateProfileInput } from "@bawsala/core";
import type { Database } from "../client";
import { profiles, type Profile } from "../schema";

export async function getProfile(db: Database, userId: string): Promise<Profile | null> {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return row ?? null;
}

export interface EnsureProfileInput {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  locale?: Locale;
}

/**
 * Returns the profile, creating it when missing. The `on_auth_user_created`
 * trigger normally does this; this is the safety net for users created before
 * the trigger existed or when auth and database migrations were applied out of order.
 */
export async function ensureProfile(db: Database, input: EnsureProfileInput): Promise<Profile> {
  const existing = await getProfile(db, input.id);
  if (existing) return existing;

  const [created] = await db
    .insert(profiles)
    .values({
      id: input.id,
      displayName: input.displayName ?? null,
      avatarUrl: input.avatarUrl ?? null,
      locale: input.locale ?? "ar",
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;
  const raced = await getProfile(db, input.id);
  if (!raced) throw new AppError("INTERNAL", "Profile could not be created");
  return raced;
}

export async function updateProfile(
  db: Database,
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  const data = updateProfileSchema.parse(input);
  const [updated] = await db
    .update(profiles)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(profiles.id, userId))
    .returning();
  if (!updated) throw new AppError("NOT_FOUND", "Profile not found");
  return updated;
}

export async function setCurrentEnergy(db: Database, userId: string, level: number): Promise<Profile> {
  return updateProfile(db, userId, { currentEnergy: level });
}
