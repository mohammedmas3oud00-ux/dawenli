import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Flame, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createHabitAction } from "@/features/habits/actions";
import { AdhkarTracker } from "@/features/habits/components/adhkar-tracker";
import { HabitItem } from "@/features/habits/components/habit-item";
import { PrayerTracker } from "@/features/habits/components/prayer-tracker";
import { QuranTracker } from "@/features/habits/components/quran-tracker";
import { getHabitsWithStatusForUser } from "@/features/habits/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("habits") };
}

export default async function HabitsPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const habits = await getHabitsWithStatusForUser(user);

  const prayerHabit = habits.find((h) => h.preset === "prayers");
  const quranHabit = habits.find((h) => h.preset === "quran");
  const adhkarHabit = habits.find((h) => h.preset === "adhkar");
  const regularHabits = habits.filter(
    (h) => h.preset !== "prayers" && h.preset !== "quran" && h.preset !== "adhkar",
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={locale === "ar" ? "العادات وبناء الشخصية" : "Habits & Consistency"}
        description={
          locale === "ar"
            ? "نظام السلاسل التراكمية لتثبيت العادات اليومية ومتابعة العبادات الإسلامية."
            : "Streak engine for daily habits, spiritual prayer presets, and atomic routines."
        }
      />

      {/* Add Habit Form */}
      <Card className="shadow-xs">
        <CardContent className="pt-5">
          <form action={createHabitAction} className="flex flex-col md:flex-row gap-3">
            <Input
              name="name"
              placeholder={locale === "ar" ? "أدخل اسم العادة الجديدة..." : "New habit name..."}
              className="flex-1"
              required
            />
            <Select name="frequency" defaultValue="daily" className="md:w-36">
              <option value="daily">{locale === "ar" ? "يومية" : "Daily"}</option>
              <option value="weekly">{locale === "ar" ? "أسبوعية" : "Weekly"}</option>
            </Select>
            <Select name="preset" defaultValue="" className="md:w-40">
              <option value="">{locale === "ar" ? "عادة عامة" : "General"}</option>
              <option value="prayers">{locale === "ar" ? "الصلوات الخمس" : "5 Prayers"}</option>
              <option value="quran">{locale === "ar" ? "ورد القرآن" : "Quran Reading"}</option>
              <option value="adhkar">{locale === "ar" ? "أذكار الصباح والمساء" : "Adhkar"}</option>
            </Select>
            <Button type="submit" className="shrink-0 gap-1.5">
              <Plus className="size-4" />
              <span>{locale === "ar" ? "إضافة عادة" : "Add Habit"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Spiritual Presets Section if configured */}
      {prayerHabit && <PrayerTracker habit={prayerHabit} locale={locale} />}
      {quranHabit && <QuranTracker habit={quranHabit} locale={locale} />}
      {adhkarHabit && <AdhkarTracker habit={adhkarHabit} locale={locale} />}

      {/* Regular Habits */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Flame className="size-4 text-amber-500 fill-amber-500" />
          {locale === "ar" ? "العادات اليومية والروتين" : "Daily Routines & Streaks"}
        </h3>

        {regularHabits.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد عادات مسجلة حالياً. أضف أول عادة من النموذج أعلاه."
                : "No habits tracked yet. Add your first habit above."}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {regularHabits.map((habit) => (
              <HabitItem key={habit.id} habit={habit} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
