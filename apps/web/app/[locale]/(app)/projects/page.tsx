import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FolderKanban, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createProjectAction } from "@/features/projects/actions";
import { ProjectCard } from "@/features/projects/components/project-card";
import { getProjectsForUser } from "@/features/projects/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("projects") };
}

export default async function ProjectsPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const projects = await getProjectsForUser(user);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={locale === "ar" ? "المشاريع ومتابعة التنفيذ" : "Projects & Execution"}
        description={
          locale === "ar"
            ? "المشاريع الميدانية التي تجمع المهام وتحسب تقدمك الفعلي التراكمي."
            : "Project workspace with automated health evaluation and task rollups."
        }
      />

      {/* Quick Add Project Form */}
      <Card className="shadow-xs">
        <CardContent className="pt-5">
          <form action={createProjectAction} className="flex flex-col md:flex-row gap-3">
            <Input
              name="title"
              placeholder={locale === "ar" ? "أدخل عنوان المشروع الجديد..." : "New project title..."}
              className="flex-1"
              required
            />
            <Input name="dueDate" type="date" className="md:w-44" />
            <Button type="submit" className="shrink-0 gap-1.5">
              <Plus className="size-4" />
              <span>{locale === "ar" ? "إضافة مشروع" : "Add Project"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center flex flex-col items-center gap-3">
            <FolderKanban className="size-10 text-muted-foreground/50" />
            <div className="flex flex-col gap-1">
              <h4 className="font-semibold text-sm">
                {locale === "ar" ? "لا توجد مشاريع نشطة حالياً" : "No active projects"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? "ابدأ بإنشاء أول مشروع وضع مهامك داخله لتتبع التقدم التلقائي."
                  : "Create your first project above to group your tasks and monitor automated rollups."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
