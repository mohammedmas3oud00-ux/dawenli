import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnergyCheckIn } from "@/features/today/components/energy-check-in";
import { getProfileForUser } from "@/features/settings/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("today") };
}

function hourIn(timeZone: string, now: Date): number {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now);
  return Number(hour) % 24;
}

export default async function TodayPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("today");
  const format = await getFormatter();

  const user = await requireUser();
  const profile = await getProfileForUser(user);

  const now = new Date();
  const hour = hourIn(profile.timezone, now);
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const comma = locale === "ar" ? "،" : ",";
  const name = profile.displayName ? `${comma} ${profile.displayName}` : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t(`greeting.${period}`, { name })}
        description={format.dateTime(now, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: profile.timezone,
        })}
      />

      <EnergyCheckIn current={profile.currentEnergy} />

      <Card>
        <CardHeader>
          <CardTitle>{t("nextUp.title")}</CardTitle>
          <CardDescription>{t("nextUp.description")}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
