import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { getProfileForUser } from "@/features/settings/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: t("title") };
}

function supportedTimeZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
  return intl.supportedValuesOf ? intl.supportedValuesOf("timeZone") : ["UTC", "Africa/Cairo"];
}

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");
  const format = await getFormatter();

  const user = await requireUser();
  const profile = await getProfileForUser(user);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} />

      <ProfileForm profile={profile} timezones={supportedTimeZones()} />

      <Card>
        <CardHeader>
          <CardTitle>{t("account.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">{t("account.email")}: </span>
            <span dir="ltr">{user.email}</span>
          </p>
          <p className="text-muted-foreground">
            {t("account.memberSince", {
              date: format.dateTime(new Date(user.created_at), { dateStyle: "long" }),
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
