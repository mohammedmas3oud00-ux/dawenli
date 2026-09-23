"use client";

import { Menu, Settings, Sun, X } from "lucide-react";
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
          className="absolute inset-x-0 top-14 z-20 flex flex-col gap-1 border-b bg-background p-3 shadow-md"
        >
          <NavLink href="/today" onClick={close}>
            <Sun aria-hidden />
            {t("today")}
          </NavLink>
          <NavLink href="/settings" onClick={close}>
            <Settings aria-hidden />
            {t("settings")}
          </NavLink>
        </nav>
      ) : null}
    </div>
  );
}
