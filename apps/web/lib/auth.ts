import { AppError } from "@bawsala/core";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = User;

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Throws `AppError("UNAUTHORIZED")` when no session is present. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHORIZED");
  return user;
}

/**
 * Resolves the user for `/api/v1/*`: accepts either a Supabase JWT in the
 * `Authorization: Bearer` header (mobile / integrations) or session cookies (web).
 */
export async function requireApiUser(request: Request): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const header = request.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];

  const {
    data: { user },
  } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

  if (!user) throw new AppError("UNAUTHORIZED");
  return user;
}
