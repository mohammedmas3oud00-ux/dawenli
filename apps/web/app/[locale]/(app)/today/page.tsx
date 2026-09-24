import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Clock, Compass, Moon, Sparkles, Timer, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seedSpiritualHabitsAction } from "@/features/habits/actions";
import { AdhkarTracker } from "@/features/habits/components/adhkar-tracker";
import { PrayerTracker } from "@/features/habits/components/prayer-tracker";
import { QuranTracker } from "@/features/habits/components/quran-tracker";
import { getHabitsWithStatusForUser } from "@/features/habits/queries";
import { getProfileForUser } from "@/features/settings/queries";
import { QuickAddTask } from "@/features/tasks/components/quick-add-task";
import { TaskItem } from "@/features/tasks/components/task-item";
import { getTaskRecommendationsForUser, getTasksForUser } from "@/features/tasks/queries";
import { EnergyCheckIn } from "@/features/today/components/energy-check-in";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("today") };
}

function hourIn(timeZone: string, now: Date): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).format(now);
  return Number(hour) % 24;
}

export default async function TodayPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("today");
  const format = await getFormatter();

  const user = await requireUser();
  const [profile, todayTasks, recommendations, habits] = await Promise.all([
    getProfileForUser(user),
    getTasksForUser(user, "today"),
    getTaskRecommendationsForUser(user),
    getHabitsWithStatusForUser(user),
  ]);

  const now = new Date();
  const hour = hourIn(profile.timezone, now);
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const comma = locale === "ar" ? "،" : ",";
  const name = profile.displayName ? `${comma} ${profile.displayName}` : "";
  const isAr = locale === "ar";

  const topRecommendation = recommendations[0];

  const prayerHabit = habits.find((h) => h.preset === "prayers");
  const quranHabit = habits.find((h) => h.preset === "quran");
  const adhkarHabit = habits.find((h) => h.preset === "adhkar");
  const hasSpiritualHabits = Boolean(prayerHabit || quranHabit || adhkarHabit);

  return (
    <div className="flex flex-col gap-6">
      {/* Cockpit Greeting */}
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

      {/* Energy Check-In */}
      <EnergyCheckIn current={profile.currentEnergy} />

      {/* Top Priority / Recommended Task for Right Now */}
      {topRecommendation && (
        <Card className="border-primary/30 bg-primary/5 shadow-xs overflow-hidden">
          <CardHeader className="pb-3 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary animate-pulse" />
                <CardTitle className="text-sm font-semibold">
                  {isAr
                    ? "أفضل مهمة للبدء بها الآن (مقترح الذكاء الاصطناعي)"
                    : "Top Recommended Task Right Now"}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs bg-background/80">
                <Sparkles className="size-3 me-1 text-primary" />
                {isAr
                  ? `تطابق ${topRecommendation.priority.score}%`
                  : `${topRecommendation.priority.score}% Match`}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="font-bold text-base text-foreground break-words">
                {topRecommendation.task.title}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {topRecommendation.task.estimateMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {topRecommendation.task.estimateMinutes} {isAr ? "دقيقة" : "min"}
                  </span>
                )}
                {topRecommendation.task.energy && (
                  <span className="flex items-center gap-1 capitalize">
                    <Zap className="size-3.5 text-amber-500" />
                    {topRecommendation.task.energy}
                  </span>
                )}
                {topRecommendation.priority.quadrant && (
                  <span className="uppercase text-primary font-medium">
                    • {topRecommendation.priority.quadrant.toUpperCase()}
                  </span>
                )}
                {topRecommendation.priority.energyFit >= 4 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    • {isAr ? "مثالية لمستوى طاقتك الآن" : "Matches energy level"}
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/${locale}/focus?taskId=${topRecommendation.task.id}`}
              className={buttonVariants({ variant: "default", size: "default" })}
            >
              <Timer className="size-4" />
              <span>{isAr ? "بدء جلسة تركيز" : "Start Focus Session"}</span>
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Bar */}
      <QuickAddTask />

      {/* Today's Tasks Execution List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Compass className="size-4 text-primary" />
            {isAr ? "مهام اليوم المجدولة" : "Today's Action Items"}
            <span className="text-xs font-normal text-muted-foreground">({todayTasks.length})</span>
          </h3>
          <Link
            href={`/${locale}/tasks`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {isAr ? "عرض كل المهام والمصفوفة" : "View All Tasks & Matrix"}
            <ArrowRight className="size-3 ms-1 rtl:rotate-180" />
          </Link>
        </div>

        {todayTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <p>
                {isAr
                  ? "لا توجد مهام مجدولة لليوم حتى الآن. استخدم شريط الإدخال السريع أعلاه لإضافة مهامك."
                  : "No tasks scheduled for today yet. Use the quick-add bar above to plan your day."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {todayTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Spiritual Life Section (القسم الروحي) */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Moon className="size-4 text-emerald-600 dark:text-emerald-400" />
            {isAr ? "القسم الروحي والعبادات" : "Spiritual Routines & Worship"}
          </h3>
          <Link
            href={`/${locale}/habits`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {isAr ? "إدارة كل العادات" : "Manage Habits"}
            <ArrowRight className="size-3 ms-1 rtl:rotate-180" />
          </Link>
        </div>

        {hasSpiritualHabits ? (
          <div className="flex flex-col gap-3">
            {prayerHabit && <PrayerTracker habit={prayerHabit} locale={locale} />}
            {quranHabit && <QuranTracker habit={quranHabit} locale={locale} />}
            {adhkarHabit && <AdhkarTracker habit={adhkarHabit} locale={locale} />}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardHeader className="text-center py-6">
              <CardTitle className="text-sm font-medium">
                {isAr ? "لم يتم تفعيل متابعة العبادات بعد" : "Spiritual presets not activated yet"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr
                  ? "يمكنك تفعيل متابعة الصلوات الخمس وورد القرآن وأذكار الصباح والمساء بنقرة واحدة."
                  : "Enable daily 5 prayers, Quran reading, and Adhkar tracking with one click."}
              </CardDescription>
              <div className="pt-3 flex justify-center">
                <form action={seedSpiritualHabitsAction}>
                  <Button type="submit" variant="outline" size="sm" className="gap-2">
                    <Sparkles className="size-3.5 text-emerald-600" />
                    <span>
                      {isAr ? "تفعيل العبادات اليومية الآن" : "Enable Spiritual Routines Now"}
                    </span>
                  </Button>
                </form>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
