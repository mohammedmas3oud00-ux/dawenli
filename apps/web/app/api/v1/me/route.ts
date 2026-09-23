import { updateProfileSchema } from "@bawsala/core";
import { updateProfile } from "@bawsala/db";
import { getProfileForUser } from "@/features/settings/queries";
import { authedRoute, ok, parseJson } from "@/lib/api/handler";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/v1/me — the caller's profile. */
export const GET = authedRoute(async ({ user }) => {
  const profile = await getProfileForUser(user);
  return ok({ ...profile, email: user.email ?? null });
});

/** PATCH /api/v1/me — partial profile update. */
export const PATCH = authedRoute(async ({ request, user }) => {
  await getProfileForUser(user);
  const input = await parseJson(request, updateProfileSchema);
  const profile = await updateProfile(db(), user.id, input);
  return ok({ ...profile, email: user.email ?? null });
});
