import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/schemas";
import type { LocaleParams } from "@/lib/types";

type Props = {
  params: LocaleParams;
  searchParams: Promise<{ next?: string; error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return { title: t("submit") };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.login");
  const { next, error } = await searchParams;
  const safeNext = safeNextPath(next, "");

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <LoginForm next={safeNext || undefined} oauthError={error === "oauth"} />
    </div>
  );
}
