"use client";

import { useTransition } from "react";
import { FileText, Link as LinkIcon, Trash2 } from "lucide-react";
import { extractWikilinks } from "@bawsala/core";
import type { Note } from "@bawsala/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteNoteAction } from "../actions";

const CATEGORY_COLORS: Record<string, string> = {
  idea: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  concept: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  summary: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  meeting: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  journal: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  general: "bg-muted text-muted-foreground border-border",
};

export function NoteCard({ note, locale }: { note: Note; locale: string }) {
  const [isPending, startTransition] = useTransition();
  const wikilinks = extractWikilinks(note.content);
  const isAr = locale === "ar";

  const handleDelete = () => {
    startTransition(async () => {
      await deleteNoteAction(note.id);
    });
  };

  return (
    <Card className="group hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="size-4 text-primary shrink-0" />
            <CardTitle className="text-base font-bold truncate">{note.title}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] capitalize shrink-0 ${
              CATEGORY_COLORS[note.category] || CATEGORY_COLORS.general
            }`}
          >
            {note.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
          {note.content || (isAr ? "(لا يوجد محتوى بعد)" : "(Empty note)")}
        </p>

        {/* Wikilinks Badges */}
        {wikilinks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
            <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
              <LinkIcon className="size-2.5" />
              {isAr ? "روابط:" : "Links:"}
            </span>
            {wikilinks.map((target) => (
              <span
                key={target}
                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium"
              >
                [[{target}]]
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
          <span>
            {new Date(note.updatedAt).toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
            })}
          </span>
          <Button
            size="icon"
            variant="ghost"
            disabled={isPending}
            onClick={handleDelete}
            className="size-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
            title="Delete note"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
