import { AppError } from "@bawsala/core";
import { DEMO_USER_EMAIL, DEMO_USER_ID } from "@bawsala/db";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isLocalDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = User;

export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "مستخدم تجريبي (Demo)", locale: "ar" },
  aud: "authenticated",
  confirmation_sent_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  email: DEMO_USER_EMAIL,
  role: "authenticated",
  updated_at: new Date().toISOString(),
} as User;

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const isDemoSession = cookieStore.get("bawsala_demo_session")?.value === "1";
  if (isLocalDemoMode() && isDemoSession) {
    return DEMO_USER;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
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
