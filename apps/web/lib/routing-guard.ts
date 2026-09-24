import { routing } from "@/i18n/routing";

const PUBLIC_SEGMENTS = new Set(["login", "register"]);

export interface RouteInfo {
  locale: string;
  /** Path segments after the locale prefix. */
  rest: string[];
  isAuthPage: boolean;
  isRoot: boolean;
}

/** Splits `/ar/settings/x` into locale + remaining segments (pure; unit-tested). */
export function analyseRoute(pathname: string): RouteInfo {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const hasLocale = Boolean(first && (routing.locales as readonly string[]).includes(first));
  const locale = hasLocale ? (first as string) : routing.defaultLocale;
  const rest = hasLocale ? segments.slice(1) : segments;
  return {
    locale,
    rest,
    isAuthPage: PUBLIC_SEGMENTS.has(rest[0] ?? ""),
    isRoot: rest.length === 0,
  };
}

export type GuardDecision =
  { action: "allow" } | { action: "redirect"; pathname: string; next?: string };

/**
 * Decides where a request should go given the auth state.
 * `next` is locale-less so the login action can re-apply the user's locale.
 */
export function decide(info: RouteInfo, isAuthenticated: boolean, search = ""): GuardDecision {
  if (!isAuthenticated && !info.isAuthPage) {
    return {
      action: "redirect",
      pathname: `/${info.locale}/login`,
      next: info.isRoot ? undefined : `/${info.rest.join("/")}${search}`,
    };
  }
  if (isAuthenticated && (info.isAuthPage || info.isRoot)) {
    return { action: "redirect", pathname: `/${info.locale}/today` };
  }
  return { action: "allow" };
}
