import { Compass, Settings, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { NavLink } from "./nav-link";

export function Sidebar() {
  const t = useTranslations();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-e bg-card md:flex">
      <div className="flex h-14 items-center gap-2 px-5 font-semibold">
        <Compass className="size-5 text-primary" aria-hidden />
        <span>{t("app.name")}</span>
      </div>
      <nav aria-label={t("app.name")} className="flex flex-1 flex-col gap-1 px-3 py-2">
        <NavLink href="/today">
          <Sun aria-hidden />
          {t("nav.today")}
        </NavLink>
        <NavLink href="/settings">
          <Settings aria-hidden />
          {t("nav.settings")}
        </NavLink>
      </nav>
      <p className="px-5 py-4 text-xs text-muted-foreground">{t("app.tagline")}</p>
    </aside>
  );
}
