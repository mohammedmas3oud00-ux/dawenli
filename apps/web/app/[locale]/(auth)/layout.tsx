import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("app");

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Compass className="size-5 text-primary" aria-hidden />
          {t("name")}
        </div>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
