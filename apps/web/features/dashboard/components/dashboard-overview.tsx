import * as React from "react";
import Link from "next/link";
import {
  Target,
  FolderKanban,
  CheckSquare,
  Flame,
  Zap,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  BookOpenCheck,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GoalWithProgress, ProjectWithProgress, Task, HabitWithTodayStatus, Review } from "@bawsala/db";

interface DashboardOverviewProps {
  locale: string;
  goals: GoalWithProgress[];
  projects: ProjectWithProgress[];
  tasks: Task[];
  habits: HabitWithTodayStatus[];
  latestReview: Review | null;
  currentEnergy: number | null;
}

export function DashboardOverview({
  locale,
  goals,
  projects,
  tasks,
  habits,
  latestReview,
  currentEnergy,
}: DashboardOverviewProps) {
  const isAr = locale === "ar";

  // Calculate Metrics
  const activeGoals = goals.filter((g) => g.status === "active");
  const avgGoalProgress =
    goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + (g.progress ?? 0), 0) / goals.length)
      : 0;

  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const avgProjectProgress =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress ?? 0), 0) / projects.length)
      : 0;

  const completedTasks = tasks.filter((t) => t.status === "done");
  const taskCompletionRate =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const urgentImportantTasks = tasks.filter(
    (t) => (t.eisenhower === "q1" || (t.importance >= 4 && (t.urgency ? t.urgency >= 4 : false))) && t.status !== "done",
  );

  const completedHabits = habits.filter((h) => h.loggedToday);
  const habitCompletionRate =
    habits.length > 0 ? Math.round((completedHabits.length / habits.length) * 100) : 0;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak)) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Goals Progress */}
        <Card className="shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {isAr ? "متوسط إنجاز الأهداف" : "Goals Alignment"}
            </span>
            <Target className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{avgGoalProgress}%</span>
              <span className="text-xs text-muted-foreground">
                {activeGoals.length} {isAr ? "أهداف نشطة" : "active"}
              </span>
            </div>
            <Progress value={avgGoalProgress} className="h-1.5" />
          </CardContent>
        </Card>

        {/* Project Health */}
        <Card className="shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {isAr ? "صحة المشاريع" : "Projects Health"}
            </span>
            <FolderKanban className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{avgProjectProgress}%</span>
              <span className="text-xs text-muted-foreground">
                {activeProjects.length} {isAr ? "نشط" : "active"} / {completedProjects.length} {isAr ? "مكتمل" : "done"}
              </span>
            </div>
            <Progress value={avgProjectProgress} className="h-1.5" />
          </CardContent>
        </Card>

        {/* Daily Tasks */}
        <Card className="shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {isAr ? "إنجاز المهام اليومية" : "Tasks Completion"}
            </span>
            <CheckSquare className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{taskCompletionRate}%</span>
              <span className="text-xs text-muted-foreground">
                {completedTasks.length} / {tasks.length} {isAr ? "مهام" : "tasks"}
              </span>
            </div>
            <Progress value={taskCompletionRate} className="h-1.5" />
          </CardContent>
        </Card>

        {/* Habits Consistency */}
        <Card className="shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-muted-foreground">
              {isAr ? "معدل العادات والالتزام" : "Habit Consistency"}
            </span>
            <Flame className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{habitCompletionRate}%</span>
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <Flame className="size-3 fill-amber-500" />
                <span>{maxStreak} {isAr ? "أيام متتالية" : "d streak"}</span>
              </div>
            </div>
            <Progress value={habitCompletionRate} className="h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Priorities & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Priorities & Focus (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Urgent & Important Tasks Card */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <span>{isAr ? "أولويات مصفوفة آيزنهاور (هام وعاجل)" : "Eisenhower Top Priorities (Q1)"}</span>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {isAr
                    ? "المهام الحرجة التي تتطلب تركيزك الفوري اليوم لتفادي تراكم الضغوط."
                    : "Mission-critical tasks requiring immediate attention today."}
                </CardDescription>
              </div>
              <Link
                href={`/${locale}/tasks`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
              >
                <span>{isAr ? "عرض الكل" : "View all"}</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {urgentImportantTasks.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-8 text-emerald-500/60" />
                  <p className="text-sm font-medium">
                    {isAr ? "رائع! لا توجد مهام طارئة متراكمة في الربع الأول." : "Clear! No urgent tasks waiting in Quadrant 1."}
                  </p>
                  <p className="text-xs">
                    {isAr
                      ? "يمكنك الآن التركيز على الربع الثاني: التخطيط وبناء الأهداف طويلة الأجل."
                      : "You can invest time into Quadrant 2: strategic goals and deep work."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {urgentImportantTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-2 rounded-full bg-red-500 shrink-0" />
                        <span className="text-sm font-medium truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.estimateMinutes && (
                          <Badge variant="outline" className="text-xs">
                            {task.estimateMinutes}m
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600 border-red-200">
                          {isAr ? "عاجل" : "Urgent"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategic Hierarchy Alignment Card */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>{isAr ? "معمارية الربط الهرمي (Bottom-Up Alignment)" : "Life OS Hierarchy Rollup"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr
                  ? "كيف تنعكس إنجازاتك اليومية صعوداً حتى الرؤية والأهداف الكبرى."
                  : "How your daily habits & tasks compound upward into projects and long-term vision."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg border bg-card flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground">{isAr ? "المستوى 4: الرؤية" : "Level 4: Vision"}</span>
                  <span className="text-sm font-bold text-primary">{isAr ? "بوصلة الحياة" : "Life Compass"}</span>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {goals.length} {isAr ? "أهداف مرتبطة" : "linked goals"}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border bg-card flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground">{isAr ? "المستوى 3: الأهداف" : "Level 3: Goals"}</span>
                  <span className="text-sm font-bold">{goals.length}</span>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {avgGoalProgress}% {isAr ? "تقدم" : "avg"}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border bg-card flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground">{isAr ? "المستوى 2: المشاريع" : "Level 2: Projects"}</span>
                  <span className="text-sm font-bold">{projects.length}</span>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {activeProjects.length} {isAr ? "نشط" : "active"}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg border bg-card flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground">{isAr ? "المستوى 1: اليومي" : "Level 1: Actions"}</span>
                  <span className="text-sm font-bold">{tasks.length}</span>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {completedTasks.length} {isAr ? "منجز" : "done"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Cockpit & Reflection (1 col) */}
        <div className="flex flex-col gap-6">
          {/* Energy & Focus Quick Widget */}
          <Card className="shadow-xs border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <span>{isAr ? "حالة الطاقة والتركيز" : "Energy & Deep Work"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                <div>
                  <div className="text-xs text-muted-foreground">{isAr ? "مستوى الطاقة الحالي" : "Current Energy"}</div>
                  <div className="text-sm font-semibold mt-0.5">
                    {currentEnergy ? `${currentEnergy} / 5` : isAr ? "غير محدد" : "Not set"}
                  </div>
                </div>
                <Link
                  href={`/${locale}/today`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
                >
                  {isAr ? "تعديل" : "Check-in"}
                </Link>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Timer className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                      {isAr ? "جلسة عمل عميق" : "Flowtime Session"}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      {isAr ? "مؤقت التركيز المرن" : "Flexible deep work timer"}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/${locale}/focus`}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "text-xs bg-emerald-600 hover:bg-emerald-700 text-white",
                  )}
                >
                  {isAr ? "بدء" : "Start"}
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Evening Reflection Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpenCheck className="size-4 text-primary" />
                <span>{isAr ? "المراجعة اليومية" : "Evening Reflection"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                {latestReview?.completedAt
                  ? isAr
                    ? `تم إكمال مراجعة اليوم بنجاح (المزاج: ${latestReview.mood ?? 4}/5، الطاقة: ${latestReview.energy ?? 3}/5).`
                    : `Today's review completed (Mood: ${latestReview.mood ?? 4}/5, Energy: ${latestReview.energy ?? 3}/5).`
                  : isAr
                  ? "لم تقم بتسجيل مراجعة هذا المساء بعد. دون إنجازاتك ودروس اليوم."
                  : "You haven't recorded your evening reflection yet. Capture your wins and lessons."}
              </p>
              <Link
                href={`/${locale}/reviews`}
                className={cn(
                  buttonVariants({
                    variant: latestReview?.completedAt ? "outline" : "default",
                    size: "sm",
                  }),
                  "w-full text-xs text-center justify-center",
                )}
              >
                {latestReview?.completedAt
                  ? isAr
                    ? "عرض أو تعديل المراجعة"
                    : "View or Edit Reflection"
                  : isAr
                  ? "إجراء المراجعة الآن"
                  : "Complete Reflection Now"}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
