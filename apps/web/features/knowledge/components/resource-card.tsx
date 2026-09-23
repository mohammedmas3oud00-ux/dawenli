"use client";

import { useTransition } from "react";
import { BookOpen, ExternalLink, GraduationCap, Headphones, Newspaper, Star, Trash2, Video } from "lucide-react";
import type { Resource } from "@bawsala/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { deleteResourceAction, updateResourceStatusAction } from "../actions";

const TYPE_ICONS: Record<string, typeof BookOpen> = {
  book: BookOpen,
  course: GraduationCap,
  article: Newspaper,
  podcast: Headphones,
  video: Video,
};

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  in_progress: { ar: "قيد المتابعة", en: "In Progress", color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  queued: { ar: "قائمة الانتظار", en: "Queued", color: "bg-muted text-muted-foreground border-border" },
  completed: { ar: "مكتمل", en: "Completed", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  abandoned: { ar: "متروك", en: "Abandoned", color: "bg-destructive/15 text-destructive border-destructive/20" },
};

const DEFAULT_STATUS_LABEL = {
  ar: "في الانتظار",
  en: "Queued",
  color: "bg-muted text-muted-foreground border-border",
};

export function ResourceCard({ resource, locale }: { resource: Resource; locale: string }) {
  const [isPending, startTransition] = useTransition();
  const isAr = locale === "ar";
  const Icon = TYPE_ICONS[resource.type] || BookOpen;
  const statusInfo = STATUS_LABELS[resource.status] ?? DEFAULT_STATUS_LABEL;


  const handleStatusChange = (newStatus: "queued" | "in_progress" | "completed" | "abandoned") => {
    startTransition(async () => {
      await updateResourceStatusAction(resource.id, newStatus);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteResourceAction(resource.id);
    });
  };

  return (
    <Card className="group hover:shadow-md transition-all flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <Icon className="size-4" />
            </div>
            <CardTitle className="text-base font-bold truncate">{resource.title}</CardTitle>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${statusInfo.color}`}>
            {isAr ? statusInfo.ar : statusInfo.en}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {resource.author && (
          <span className="text-xs text-muted-foreground font-medium">
            {isAr ? `المؤلف / المدرب: ${resource.author}` : `By: ${resource.author}`}
          </span>
        )}

        {resource.rating && (
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${
                  i < resource.rating! ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}

        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium truncate"
          >
            <ExternalLink className="size-3 shrink-0" />
            <span>{isAr ? "رابط المصدر" : "Resource Link"}</span>
          </a>
        )}

        <div className="flex items-center justify-between pt-3 border-t gap-2">
          <Select
            value={resource.status}
            disabled={isPending}
            onChange={(e) =>
              handleStatusChange(
                e.target.value as "queued" | "in_progress" | "completed" | "abandoned",
              )
            }
            className="h-7 text-xs w-32"
          >
            <option value="in_progress">{isAr ? "قيد المتابعة" : "In Progress"}</option>
            <option value="queued">{isAr ? "في الانتظار" : "Queued"}</option>
            <option value="completed">{isAr ? "مكتمل" : "Completed"}</option>
            <option value="abandoned">{isAr ? "متروك" : "Abandoned"}</option>
          </Select>

          <Button
            size="icon"
            variant="ghost"
            disabled={isPending}
            onClick={handleDelete}
            className="size-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
            title="Delete resource"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
