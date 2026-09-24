import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { hasSupabaseEnv } from "@/lib/env";
import { analyseRoute, decide } from "@/lib/routing-guard";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Next.js 16 proxy (formerly middleware):
 * 1. Locale detection / redirect via next-intl.
 * 2. Supabase session refresh (cookie rotation).
 * 3. Auth gating: unauthenticated → /login, authenticated on auth pages → /today.
 */
export default async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  // A redirect (e.g. "/" → "/ar") needs no auth work.
  if (response.status >= 300 && response.status < 400) return response;

  const isDemo = request.cookies.get("bawsala_demo_session")?.value === "1";
  if (isDemo) {
    const decision = decide(analyseRoute(request.nextUrl.pathname), true, request.nextUrl.search);
    if (decision.action === "allow") return response;

    const url = request.nextUrl.clone();
    url.pathname = decision.pathname;
    url.search = "";
    if (decision.next) url.searchParams.set("next", decision.next);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (!hasSupabaseEnv()) return response;

  const user = await refreshSupabaseSession(request, response);
  const decision = decide(
    analyseRoute(request.nextUrl.pathname),
    Boolean(user),
    request.nextUrl.search,
  );

  if (decision.action === "allow") return response;

  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;
  url.search = "";
  if (decision.next) url.searchParams.set("next", decision.next);
  return copyCookies(response, NextResponse.redirect(url));
}

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie);
  return to;
}

export const config = {
  // Skip API routes, the OAuth callback, Next internals and static files.
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
