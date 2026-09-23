import type { Locale } from "next-intl";

/** Props shared by every page/layout under `app/[locale]`. */
export type LocaleParams = Promise<{ locale: Locale }>;
