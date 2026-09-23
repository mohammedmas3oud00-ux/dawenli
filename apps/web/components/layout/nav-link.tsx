"use client";

import type { ComponentProps } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Href = ComponentProps<typeof Link>["href"];

export function NavLink({
  href,
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: Href }) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : href.pathname;
  const active = pathname === target || pathname.startsWith(`${target}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
