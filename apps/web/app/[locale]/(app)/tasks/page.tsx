import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getEisenhowerMatrixForUser,
  getTaskRecommendationsForUser,
  getTasksForUser,
} from "@/features/tasks/queries";
import { EisenhowerMatrix } from "@/features/tasks/components/eisenhower-matrix";
import { QuickAddTask } from "@/features/tasks/components/quick-add-task";
import { TaskItem } from "@/features/tasks/components/task-item";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

type Props = { params: LocaleParams; searchParams: Promise<{ view?: string }> };

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("tasks") };
}

export default async function TasksPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const search = await searchParams;
  const activeView = search.view || "matrix";

  const [matrix, tasks, recommendations] = await Promise.all([
    getEisenhowerMatrixForUser(user),
    getTasksForUser(user, "all"),
    getTaskRecommendationsForUser(user),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={locale === "ar" ? "المهام وقرارات الأولويات" : "Tasks & Priority Engine"}
        description={
          locale === "ar"
            ? "نظام أيزنهاور لتوجيه طاقتك نحو المهام الأكثر تأثيراً على أهدافك."
            : "Eisenhower 2x2 prioritization matrix and energy-aware task dispatcher."
        }
      />

      <QuickAddTask />

      {recommendations.length > 0 ? (
        <Card className="border-primary/20 bg-primary/5 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              {locale === "ar" ? "أفضل مهمة للإنجاز الآن (توصية الذكاء الاصطناعي):" : "Recommended for Right Now:"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recommendations.slice(0, 2).map((rec) => (
              <TaskItem key={rec.task.id} task={rec.task} />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <Link
            href="?view=matrix"
            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
              activeView === "matrix" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {locale === "ar" ? "مصفوفة أيزنهاور" : "Eisenhower Matrix"}
          </Link>
          <Link
            href="?view=list"
            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
              activeView === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {locale === "ar" ? "قائمة المهام بالكامل" : "All Tasks List"} ({tasks.length})
          </Link>
        </div>

        {activeView === "matrix" ? (
          <EisenhowerMatrix matrix={matrix} />
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {locale === "ar" ? "لا توجد مهام حالياً. ابدأ بإضافة مهمة أعلاه." : "No tasks found. Add a task above."}
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
