import { redirect } from "@/i18n/navigation";
import type { LocaleParams } from "@/lib/types";

/** The proxy sends signed-in users to /today; anyone else lands on /login. */
export default async function LocaleIndex({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  redirect({ href: "/login", locale });
}
