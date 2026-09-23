import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { FocusTimer } from "@/features/focus/components/focus-timer";
import { getRecentTimeEntriesForUser, getTimeStatsForUser } from "@/features/focus/queries";
import { getTasksForUser } from "@/features/tasks/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

type Props = {
  params: LocaleParams;
  searchParams?: Promise<{ taskId?: string }>;
};

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("focus") };
}

export default async function FocusPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const search = await searchParams;
  const user = await requireUser();

  const [tasks, stats, recentEntries] = await Promise.all([
    getTasksForUser(user, "today"),
    getTimeStatsForUser(user),
    getRecentTimeEntriesForUser(user),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={locale === "ar" ? "غرفة العمل العميق وتتبع الوقت" : "Deep Work & Time Tracking"}
        description={
          locale === "ar"
            ? "مؤقت بومودورو وتدفق العمل العميق مع تسجيل وحساب ساعات عملك الفعلية."
            : "Pomodoro & Deep Work Flowtime timer with automated time logs."
        }
      />

      <FocusTimer
        tasks={tasks}
        locale={locale}
        initialTaskId={search?.taskId}
        stats={stats}
        recentEntries={recentEntries}
      />
    </div>
  );
}
