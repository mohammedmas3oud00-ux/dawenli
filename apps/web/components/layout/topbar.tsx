import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { MobileNav } from "./mobile-nav";

export function Topbar({ displayName }: { displayName: string | null }) {
  const t = useTranslations("nav");

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
        <span className="text-sm text-muted-foreground">{displayName}</span>
      </div>
      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label={t("signOut")}
            title={t("signOut")}
          >
            <LogOut />
          </Button>
        </form>
      </div>
    </header>
  );
}
