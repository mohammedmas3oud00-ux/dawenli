import {
  BookOpen,
  BookOpenCheck,
  CheckSquare,
  Compass,
  Flame,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Sun,
  Target,
  Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { NavLink } from "./nav-link";

export function Sidebar() {
  const t = useTranslations();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e bg-card md:flex">
      <div className="flex h-14 items-center gap-2 px-5 font-semibold">
        <Compass className="size-5 text-primary" aria-hidden />
        <span>{t("app.name")}</span>
      </div>
      <nav aria-label={t("app.name")} className="flex flex-1 flex-col gap-1 px-3 py-2">
        <NavLink href="/today">
          <Sun aria-hidden className="size-4" />
          {t("nav.today")}
        </NavLink>
        <NavLink href="/dashboard">
          <LayoutDashboard aria-hidden className="size-4" />
          {t("nav.dashboard")}
        </NavLink>
        <NavLink href="/goals">
          <Target aria-hidden className="size-4" />
          {t("nav.goals")}
        </NavLink>
        <NavLink href="/projects">
          <FolderKanban aria-hidden className="size-4" />
          {t("nav.projects")}
        </NavLink>
        <NavLink href="/tasks">
          <CheckSquare aria-hidden className="size-4" />
          {t("nav.tasks")}
        </NavLink>
        <NavLink href="/habits">
          <Flame aria-hidden className="size-4 text-amber-500" />
          {t("nav.habits")}
        </NavLink>
        <NavLink href="/focus">
          <Timer aria-hidden className="size-4 text-emerald-500" />
          {t("nav.focus")}
        </NavLink>
        <NavLink href="/knowledge">
          <BookOpen aria-hidden className="size-4 text-sky-500" />
          {t("nav.knowledge")}
        </NavLink>
        <NavLink href="/reviews">
          <BookOpenCheck aria-hidden className="size-4" />
          {t("nav.reviews")}
        </NavLink>
        <NavLink href="/settings">
          <Settings aria-hidden className="size-4" />
          {t("nav.settings")}
        </NavLink>
      </nav>
      <p className="px-5 py-4 text-xs text-muted-foreground">{t("app.tagline")}</p>
    </aside>
  );
}
