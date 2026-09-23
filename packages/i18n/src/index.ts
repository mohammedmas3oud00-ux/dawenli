import { DEFAULT_LOCALE, LOCALES, RTL_LOCALES, type Locale } from "@bawsala/core";

export { DEFAULT_LOCALE, LOCALES, RTL_LOCALES, type Locale };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function directionFor(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/** Display names for the locale switcher, each written in its own language. */
export const LOCALE_LABELS: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export type Messages = typeof import("../messages/en.json");
