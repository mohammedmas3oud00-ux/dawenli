import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createGoalAction } from "@/features/goals/actions";
import { GoalCard } from "@/features/goals/components/goal-card";
import { getGoalsForUser } from "@/features/goals/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("goals") };
}

export default async function GoalsPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const goals = await getGoalsForUser(user);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={locale === "ar" ? "الأهداف والآفاق الزمنية" : "Goals & Horizons"}
        description={
          locale === "ar"
            ? "ربط الأهداف السنوية والفصلية بالمشاريع والمهام اليومية مع حساب التقدم التراكمي."
            : "Strategic life goals across horizons with automated bottom-up progress rollups."
        }
      />

      {/* Quick Add Goal Card */}
      <Card className="shadow-xs">
        <CardContent className="pt-5">
          <form action={createGoalAction} className="flex flex-col md:flex-row gap-3">
            <Input
              name="title"
              placeholder={locale === "ar" ? "أدخل عنوان الهدف الجديد..." : "New goal title..."}
              className="flex-1"
              required
            />
            <Select name="horizon" defaultValue="annual" className="md:w-36">
              <option value="annual">{locale === "ar" ? "سنوي" : "Annual"}</option>
              <option value="quarterly">{locale === "ar" ? "فصلي (Q)" : "Quarterly"}</option>
              <option value="monthly">{locale === "ar" ? "شهري" : "Monthly"}</option>
              <option value="life">{locale === "ar" ? "مدى الحياة" : "Lifetime"}</option>
            </Select>
            <Button type="submit" className="shrink-0 gap-1.5">
              <Plus className="size-4" />
              <span>{locale === "ar" ? "إضافة هدف" : "Add Goal"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center flex flex-col items-center gap-3">
            <Target className="size-10 text-muted-foreground/50" />
            <div className="flex flex-col gap-1">
              <h4 className="font-semibold text-sm">
                {locale === "ar" ? "لا توجد أهداف محددة حتى الآن" : "No goals set yet"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? "ابدأ بتحديد أهدافك السنوية لتوجيه مشاريعك ومهامك اليومية."
                  : "Define your annual or quarterly goals above to connect your daily tasks to your big picture."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
