import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { BookOpen, FileText, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createNoteAction, createResourceAction } from "@/features/knowledge/actions";
import { NoteCard } from "@/features/knowledge/components/note-card";
import { ResourceCard } from "@/features/knowledge/components/resource-card";
import { getNotesForUser, getResourcesForUser } from "@/features/knowledge/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

type Props = {
  params: LocaleParams;
  searchParams?: Promise<{ tab?: string; category?: string; search?: string }>;
};

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "ar" ? "المعرفة" : "Knowledge" };
}

export default async function KnowledgePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const search = await searchParams;
  const activeTab = search?.tab || "notes";
  const isAr = locale === "ar";

  const [notes, resources] = await Promise.all([
    getNotesForUser(user, { category: search?.category, search: search?.search }),
    getResourcesForUser(user),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isAr ? "العقل الثاني وإدارة المعرفة" : "Second Brain & Knowledge Hub"}
        description={
          isAr
            ? "نظام تدوين الملاحظات المترابطة بالروابط التبادلية، ومكتبة المصادر والكتب والكورسات."
            : "Interlinked notes with wikilinks and learning library for books, courses, and articles."
        }
      />

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Link
          href="?tab=notes"
          className={buttonVariants({
            variant: activeTab === "notes" ? "default" : "ghost",
            size: "sm",
          })}
        >
          <FileText className="size-4" />
          <span>{isAr ? `الملاحظات (${notes.length})` : `Notes (${notes.length})`}</span>
        </Link>
        <Link
          href="?tab=resources"
          className={buttonVariants({
            variant: activeTab === "resources" ? "default" : "ghost",
            size: "sm",
          })}
        >
          <BookOpen className="size-4" />
          <span>
            {isAr ? `المصادر والتعلم (${resources.length})` : `Resources (${resources.length})`}
          </span>
        </Link>
      </div>

      {/* TAB 1: NOTES & SECOND BRAIN */}
      {activeTab === "notes" && (
        <div className="flex flex-col gap-6">
          {/* Quick Create Note Card */}
          <Card className="shadow-xs border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <form action={createNoteAction} className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    name="title"
                    placeholder={isAr ? "عنوان الفكرة أو الملاحظة الجديدة..." : "Note title..."}
                    className="flex-1 bg-background"
                    required
                  />
                  <Select name="category" defaultValue="general" className="sm:w-40 bg-background">
                    <option value="idea">{isAr ? "فكرة (Idea)" : "Idea"}</option>
                    <option value="concept">{isAr ? "مفهوم (Concept)" : "Concept"}</option>
                    <option value="summary">{isAr ? "ملخص (Summary)" : "Summary"}</option>
                    <option value="meeting">{isAr ? "اجتماع (Meeting)" : "Meeting"}</option>
                    <option value="journal">{isAr ? "يوميات (Journal)" : "Journal"}</option>
                    <option value="general">{isAr ? "عام (General)" : "General"}</option>
                  </Select>
                </div>

                <Textarea
                  name="content"
                  rows={3}
                  placeholder={
                    isAr
                      ? "اكتب ملاحظتك هنا... يمكنك ربط الملاحظات ببعضها بكتابة [[اسم الملاحظة]]."
                      : "Write your note here... Use [[Note Title]] to create wikilinks."
                  }
                  className="bg-background resize-none text-xs"
                />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="size-3 text-primary" />
                    {isAr ? "يدعم الروابط التبادلية [[Wikilinks]]" : "Supports [[Wikilinks]]"}
                  </span>
                  <Button type="submit" size="sm" className="gap-1.5">
                    <Plus className="size-4" />
                    <span>{isAr ? "حفظ الملاحظة" : "Create Note"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notes Grid */}
          {notes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {isAr
                  ? "لا توجد ملاحظات مسجلة بعد. دوّن أول فكرة أو ملخص من النموذج أعلاه."
                  : "No notes recorded yet. Capture your first idea above."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} locale={locale} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESOURCES & LEARNING */}
      {activeTab === "resources" && (
        <div className="flex flex-col gap-6">
          {/* Create Resource Card */}
          <Card className="shadow-xs border-primary/20 bg-primary/5">
            <CardContent className="pt-5">
              <form action={createResourceAction} className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    name="title"
                    placeholder={isAr ? "اسم الكتاب، الكورس، أو المقال..." : "Resource title..."}
                    className="flex-1 bg-background"
                    required
                  />
                  <Select name="type" defaultValue="book" className="sm:w-36 bg-background">
                    <option value="book">{isAr ? "كتاب (Book)" : "Book"}</option>
                    <option value="course">{isAr ? "كورس (Course)" : "Course"}</option>
                    <option value="article">{isAr ? "مقال (Article)" : "Article"}</option>
                    <option value="podcast">{isAr ? "بودكاست (Podcast)" : "Podcast"}</option>
                    <option value="video">{isAr ? "فيديو (Video)" : "Video"}</option>
                  </Select>
                  <Select name="status" defaultValue="queued" className="sm:w-36 bg-background">
                    <option value="queued">{isAr ? "في الانتظار" : "Queued"}</option>
                    <option value="in_progress">{isAr ? "قيد المتابعة" : "In Progress"}</option>
                    <option value="completed">{isAr ? "مكتمل" : "Completed"}</option>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    name="author"
                    placeholder={isAr ? "المؤلف أو المدرب (اختياري)..." : "Author / Instructor..."}
                    className="sm:w-1/2 bg-background text-xs"
                  />
                  <Input
                    name="url"
                    type="url"
                    placeholder={isAr ? "رابط المصدر أو المقال (اختياري)..." : "Resource URL..."}
                    className="sm:w-1/2 bg-background text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" size="sm" className="gap-1.5">
                    <Plus className="size-4" />
                    <span>{isAr ? "إضافة إلى المكتبة" : "Add to Library"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Resources Grid */}
          {resources.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {isAr
                  ? "لا توجد مصادر تعليمية مضافة حتى الآن. أضف أول كتاب أو كورس من النموذج أعلاه."
                  : "No learning resources added yet. Add your first book or course above."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res) => (
                <ResourceCard key={res.id} resource={res} locale={locale} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
