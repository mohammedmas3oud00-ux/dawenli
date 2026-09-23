import type { ReactNode } from "react";
import { redirect } from "@/i18n/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getProfileForUser } from "@/features/settings/queries";
import { getCurrentUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LocaleParams;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) {
    // The proxy normally gates this; this is the server-side fallback.
    redirect({ href: "/login", locale });
    return null;
  }

  const profile = await getProfileForUser(user);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar displayName={profile.displayName ?? user.email ?? null} />
        <main className="mx-auto w-full max-w-4xl flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
