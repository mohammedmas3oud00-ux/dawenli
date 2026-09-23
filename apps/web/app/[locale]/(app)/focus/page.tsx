import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { FocusTimer } from "@/features/focus/components/focus-timer";
import { getTasksForUser } from "@/features/tasks/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("focus") };
}

export default async function FocusPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const tasks = await getTasksForUser(user, "today");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={locale === "ar" ? "غرفة العمل العميق والتركيز" : "Deep Work & Focus Mode"}
        description={
          locale === "ar"
            ? "مؤقت بومودورو وتدفق العمل العميق لزيادة إنتاجيتك وإنجاز مهامك بلا تشتيت."
            : "Pomodoro & Deep Work Flowtime timer connected to your prioritized tasks."
        }
      />

      <FocusTimer tasks={tasks} locale={locale} />
    </div>
  );
}
