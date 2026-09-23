import { isLocale } from "@bawsala/i18n";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { safeNextPath } from "@/features/auth/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link landing: exchanges the PKCE code for a session cookie and
 * forwards to the localized destination.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const localeParam = url.searchParams.get("locale");
  const locale = isLocale(localeParam) ? localeParam : routing.defaultLocale;
  const next = safeNextPath(url.searchParams.get("next"), "/today");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(`/${locale}${next}`, url.origin));
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/login?error=oauth`, url.origin));
}
