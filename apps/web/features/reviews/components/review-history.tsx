import * as React from "react";
import { Calendar, Award, Lightbulb, Zap, Smile, Meh, Frown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Review } from "@bawsala/db";

interface ReviewHistoryProps {
  reviews: Review[];
  locale: string;
}

export function ReviewHistory({ reviews, locale }: ReviewHistoryProps) {
  const isAr = locale === "ar";

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center flex flex-col items-center gap-2">
          <Calendar className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {isAr ? "سجل المراجعات فارغ حالياً" : "No previous reviews recorded"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "املأ نموذج المراجعة اليومية لتبدأ في تتبع سجلك الإنتاجي والنفسي."
              : "Complete your first daily reflection above to start building your review history."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-base">
        {isAr ? "سجل المراجعات السابقة" : "Previous Reviews History"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((rev) => {
          const wins = Array.isArray(rev.wins) ? (rev.wins as string[]) : [];
          const lessons = Array.isArray(rev.lessons) ? (rev.lessons as string[]) : [];

          return (
            <Card key={rev.id} className="shadow-xs hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">{rev.periodStart}</CardTitle>
                  <Badge variant="outline" className="capitalize text-xs">
                    {rev.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {rev.mood && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {rev.mood >= 4 ? (
                        <Smile className="size-3 text-emerald-500" />
                      ) : rev.mood === 3 ? (
                        <Meh className="size-3 text-yellow-500" />
                      ) : (
                        <Frown className="size-3 text-amber-500" />
                      )}
                      <span>{rev.mood}/5</span>
                    </Badge>
                  )}
                  {rev.energy && (
                    <Badge variant="outline" className="gap-1 text-xs border-amber-500/30 text-amber-700 dark:text-amber-300">
                      <Zap className="size-3 fill-amber-500 text-amber-500" />
                      <span>{rev.energy}/5</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                {wins.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                      <Award className="size-3" />
                      <span>{isAr ? "الإنجازات" : "Wins"}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ps-1">
                      {wins.map((w, idx) => (
                        <li key={idx} className="truncate">
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lessons.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 font-medium text-primary mb-1">
                      <Lightbulb className="size-3" />
                      <span>{isAr ? "الدروس المستفادة" : "Key Lessons"}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ps-1">
                      {lessons.map((l, idx) => (
                        <li key={idx} className="truncate">
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
