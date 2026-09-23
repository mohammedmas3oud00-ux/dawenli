"use client";

import { LOCALE_LABELS } from "@bawsala/i18n";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "@/components/ui/select";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select
      aria-label={t("label")}
      value={locale}
      className="h-8 w-auto text-xs"
      onChange={(event) => {
        const next = event.target.value as (typeof routing.locales)[number];
        // Routes are static in Phase 1; dynamic segments will pass `params` here.
        router.replace(pathname, { locale: next });
      }}
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </Select>
  );
}
