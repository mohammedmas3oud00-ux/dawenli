import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getGoalsForUser } from "@/features/goals/queries";
import { getHabitsWithStatusForUser } from "@/features/habits/queries";
import { getProjectsForUser } from "@/features/projects/queries";
import { getLatestDailyReviewForUser } from "@/features/reviews/queries";
import { getProfileForUser } from "@/features/settings/queries";
import { getTasksForUser } from "@/features/tasks/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("dashboard") };
}

export default async function DashboardPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();

  const [profile, goals, projects, tasks, habits, latestReview] = await Promise.all([
    getProfileForUser(user),
    getGoalsForUser(user),
    getProjectsForUser(user),
    getTasksForUser(user, "all"),
    getHabitsWithStatusForUser(user),
    getLatestDailyReviewForUser(user),
  ]);

  const isAr = locale === "ar";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isAr ? "لوحة القيادة والتحليلات" : "Executive Dashboard & Cockpit"}
        description={
          isAr
            ? "نظرة شمولية موحدة تربط بين الأهداف الاستراتيجية والمشاريع ومعدلات الإنجاز اليومية."
            : "Holistic life cockpit tracking strategic goals, project health, daily execution, and habits."
        }
      />

      <DashboardOverview
        locale={locale}
        goals={goals}
        projects={projects}
        tasks={tasks}
        habits={habits}
        latestReview={latestReview}
        currentEnergy={profile.currentEnergy}
      />
    </div>
  );
}
