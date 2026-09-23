import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@bawsala/i18n";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});
