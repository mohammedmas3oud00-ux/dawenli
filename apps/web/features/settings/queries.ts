import { ensureProfile, type Profile } from "@bawsala/db";
import { isLocale } from "@bawsala/i18n";
import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/db";

/** Loads (and lazily bootstraps) the profile for the signed-in user. */
export async function getProfileForUser(user: User): Promise<Profile> {
  const meta = user.user_metadata ?? {};
  const locale = meta.locale;
  return ensureProfile(db(), {
    id: user.id,
    displayName: meta.full_name ?? meta.name ?? null,
    avatarUrl: meta.avatar_url ?? null,
    locale: isLocale(locale) ? locale : undefined,
  });
}
