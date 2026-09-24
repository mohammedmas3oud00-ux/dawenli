"use client";

import * as React from "react";
import { CheckCircle2, Sparkles, Zap, Smile, Meh, Frown, Award, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitReviewAction } from "../actions";
import type { Review } from "@bawsala/db";

const MOODS = [
  { value: 1, labelAr: "مرهق", labelEn: "Drained", icon: Frown, color: "text-red-500" },
  { value: 2, labelAr: "متعب", labelEn: "Low", icon: Frown, color: "text-amber-500" },
  { value: 3, labelAr: "مستقر", labelEn: "Steady", icon: Meh, color: "text-yellow-500" },
  { value: 4, labelAr: "جيد", labelEn: "Good", icon: Smile, color: "text-emerald-500" },
  { value: 5, labelAr: "رائع", labelEn: "Peak", icon: Sparkles, color: "text-primary" },
];

const ENERGIES = [
  { value: 1, labelAr: "1 - منخفضة جداً", labelEn: "1 - Very Low" },
  { value: 2, labelAr: "2 - منخفضة", labelEn: "2 - Low" },
  { value: 3, labelAr: "3 - متوسطة", labelEn: "3 - Moderate" },
  { value: 4, labelAr: "4 - مرتفعة", labelEn: "4 - High" },
  { value: 5, labelAr: "5 - طاقة قصوى", labelEn: "5 - Peak" },
];

interface ReviewFormProps {
  initialReview?: Review | null;
  locale: string;
}

export function ReviewForm({ initialReview, locale }: ReviewFormProps) {
  const isAr = locale === "ar";
  const [mood, setMood] = React.useState<number>(initialReview?.mood ?? 4);
  const [energy, setEnergy] = React.useState<number>(initialReview?.energy ?? 3);
  const [wins, setWins] = React.useState<string>(
    Array.isArray(initialReview?.wins) ? (initialReview.wins as string[]).join("\n") : "",
  );
  const [lessons, setLessons] = React.useState<string>(
    Array.isArray(initialReview?.lessons) ? (initialReview.lessons as string[]).join("\n") : "",
  );
  const [isPending, startTransition] = React.useTransition();
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("mood", String(mood));
    formData.append("energy", String(energy));
    formData.append("wins", wins);
    formData.append("lessons", lessons);

    startTransition(async () => {
      await submitReviewAction(formData);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    });
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <CardTitle className="text-lg">
            {isAr ? "المراجعة اليومية المسائية" : "Daily Evening Reflection"}
          </CardTitle>
        </div>
        <CardDescription>
          {isAr
            ? "اختتم يومك بتقييم الطاقة والإنجاز والدروس المستفادة لتحسين الغد."
            : "Close your day by rating energy, capturing wins, and recording lessons learned."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Mood Selector */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">
              {isAr ? "كيف كان مزاجك اليوم؟" : "How was your mood today?"}
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => {
                const Icon = m.icon;
                const isSelected = mood === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs font-semibold"
                        : "border-muted/60 hover:bg-muted/40"
                    }`}
                  >
                    <Icon
                      className={`size-6 mb-1 ${isSelected ? m.color : "text-muted-foreground"}`}
                    />
                    <span className="text-xs">{isAr ? m.labelAr : m.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Level */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Zap className="size-4 text-amber-500" />
              <Label className="text-sm font-medium">
                {isAr ? "مستوى الطاقة بنهاية اليوم:" : "End-of-day energy level:"}
              </Label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {ENERGIES.map((e) => {
                const isSelected = energy === e.value;
                return (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => setEnergy(e.value)}
                    className={`py-2 px-1 text-center rounded-md border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200"
                        : "border-muted/60 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {e.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wins */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Award className="size-4 text-emerald-500" />
              <Label htmlFor="wins" className="text-sm font-medium">
                {isAr
                  ? "ماذا أنجزت اليوم؟ (اكتب كل إنجاز في سطر)"
                  : "What did you accomplish today? (one per line)"}
              </Label>
            </div>
            <Textarea
              id="wins"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder={
                isAr
                  ? "مثال:\n- إكمال مهمة هيكلة قاعدة البيانات\n- المشي لمدة 30 دقيقة\n- قراءة ورد القرآن"
                  : "e.g.:\n- Completed database schema migration\n- 30-min brisk walk\n- Read 1 chapter"
              }
              rows={4}
            />
          </div>

          {/* Lessons */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="size-4 text-primary" />
              <Label htmlFor="lessons" className="text-sm font-medium">
                {isAr
                  ? "أهم درس أو فكرة تعلمتها اليوم:"
                  : "Key lesson or reflection learned today:"}
              </Label>
            </div>
            <Textarea
              id="lessons"
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder={
                isAr
                  ? "ما الذي يمكنك تحسينه غداً؟ كيف تدير تركيزك بشكل أفضل؟"
                  : "What can you improve tomorrow? How will you protect your focus?"
              }
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {submitted ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="size-4" />
                <span>{isAr ? "تم حفظ المراجعة بنجاح!" : "Review saved successfully!"}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {initialReview?.completedAt
                  ? isAr
                    ? "تم التقييم مسبقاً، يمكنك التعديل والحفظ مجدداً."
                    : "Previously submitted; you can update anytime."
                  : ""}
              </span>
            )}
            <Button type="submit" disabled={isPending} className="gap-2">
              <CheckCircle2 className="size-4" />
              <span>
                {isPending
                  ? isAr
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : isAr
                    ? "حفظ المراجعة"
                    : "Save Review"}
              </span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
