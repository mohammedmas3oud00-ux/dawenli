"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect as redirectExternal } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/action-result";
import { publicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authErrorKey, loginSchema, magicLinkSchema, registerSchema, safeNextPath } from "./schemas";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export async function signInWithPassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations("auth.errors");
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: t("invalidEmail"), fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { status: "error", message: t(authErrorKey(error.code)) };

  redirect({ href: safeNextPath(parsed.data.next, "/today"), locale: await getLocale() });
  return { status: "success" };
}

export async function signInWithMagicLink(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations("auth");
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: t("errors.invalidEmail"), fieldErrors: fieldErrors(parsed.error) };
  }

  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: callbackUrl(locale, safeNextPath(parsed.data.next, "/today")),
      data: { locale },
    },
  });
  if (error) return { status: "error", message: t(`errors.${authErrorKey(error.code)}`) };
  return { status: "success", message: t("login.magicLinkSent") };
}

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const t = await getTranslations("auth");
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    const message = errors.password ? t("errors.weakPassword") : t("errors.invalidEmail");
    return { status: "error", message, fieldErrors: errors };
  }

  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl(locale, "/today"),
      data: { full_name: parsed.data.displayName, locale },
    },
  });
  if (error) return { status: "error", message: t(`errors.${authErrorKey(error.code)}`) };

  // With email confirmation enabled Supabase returns a user without a session.
  if (!data.session) return { status: "success", message: t("register.confirmEmail") };

  redirect({ href: "/today", locale });
  return { status: "success" };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const next = safeNextPath(formData.get("next")?.toString(), "/today");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl(locale, next),
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error || !data.url) {
    redirect({ href: { pathname: "/login", query: { error: "oauth" } }, locale });
    return;
  }
  // Provider URL is external — bypass the locale-aware redirect.
  redirectExternal(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/login", locale });
}

function callbackUrl(locale: string, next: string): string {
  const url = new URL("/auth/callback", publicEnv().NEXT_PUBLIC_APP_URL);
  url.searchParams.set("locale", locale);
  url.searchParams.set("next", next);
  return url.toString();
}
