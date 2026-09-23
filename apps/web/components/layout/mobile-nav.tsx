"use client";

import {
  BookOpen,
  BookOpenCheck,
  CheckSquare,
  Flame,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Settings,
  Sun,
  Target,
  Timer,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NavLink } from "./nav-link";

export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <Menu />}
      </Button>
      {open ? (
        <nav
          id="mobile-nav"
          className="absolute inset-x-0 top-14 z-20 flex flex-col gap-1 border-b bg-background p-3 shadow-lg"
        >
          <NavLink href="/today" onClick={close}>
            <Sun aria-hidden className="size-4" />
            {t("today")}
          </NavLink>
          <NavLink href="/dashboard" onClick={close}>
            <LayoutDashboard aria-hidden className="size-4" />
            {t("dashboard")}
          </NavLink>
          <NavLink href="/goals" onClick={close}>
            <Target aria-hidden className="size-4" />
            {t("goals")}
          </NavLink>
          <NavLink href="/projects" onClick={close}>
            <FolderKanban aria-hidden className="size-4" />
            {t("projects")}
          </NavLink>
          <NavLink href="/tasks" onClick={close}>
            <CheckSquare aria-hidden className="size-4" />
            {t("tasks")}
          </NavLink>
          <NavLink href="/habits" onClick={close}>
            <Flame aria-hidden className="size-4 text-amber-500" />
            {t("habits")}
          </NavLink>
          <NavLink href="/focus" onClick={close}>
            <Timer aria-hidden className="size-4 text-emerald-500" />
            {t("focus")}
          </NavLink>
          <NavLink href="/knowledge" onClick={close}>
            <BookOpen aria-hidden className="size-4 text-sky-500" />
            {t("knowledge")}
          </NavLink>
          <NavLink href="/reviews" onClick={close}>
            <BookOpenCheck aria-hidden className="size-4" />
            {t("reviews")}
          </NavLink>
          <NavLink href="/settings" onClick={close}>
            <Settings aria-hidden className="size-4" />
            {t("settings")}
          </NavLink>
        </nav>
      ) : null}
    </div>
  );
}
