import type { TemplateField, TemplateType } from "@bawsala/core";

export interface SystemTemplate {
  type: TemplateType;
  name: string;
  schema: TemplateField[];
}

const rating = (key: string, labelAr: string, labelEn: string): TemplateField => ({
  key,
  labelAr,
  labelEn,
  type: "rating",
  required: false,
});
const list = (key: string, labelAr: string, labelEn: string): TemplateField => ({
  key,
  labelAr,
  labelEn,
  type: "list",
  required: false,
});
const textarea = (
  key: string,
  labelAr: string,
  labelEn: string,
  required = false,
): TemplateField => ({
  key,
  labelAr,
  labelEn,
  type: "textarea",
  required,
});

/** Built-in review templates (docs/database-schema.md §3.4, Prompt.md §5). */
export const SYSTEM_TEMPLATES: readonly SystemTemplate[] = [
  {
    type: "daily_review",
    name: "Daily Review",
    schema: [
      list("accomplished", "ماذا أنجزت اليوم؟", "What did you accomplish today?"),
      list("not_done", "ما الذي لم يُنجز؟", "What was left undone?"),
      textarea("lesson", "أهم درس اليوم", "Most important lesson today"),
      rating("focus", "تقييم التركيز", "Focus rating"),
      rating("energy", "تقييم الطاقة", "Energy rating"),
      list("tomorrow_top3", "أهم 3 مهام للغد", "Top 3 tasks for tomorrow"),
    ],
  },
  {
    type: "weekly_review",
    name: "Weekly Review",
    schema: [
      list("wins", "الإنجازات", "Wins"),
      list("problems", "المشاكل والعوائق", "Problems & blockers"),
      list("delayed_projects", "المشاريع المتأخرة", "Delayed projects"),
      textarea(
        "priority_changes",
        "تعديل الأولويات للأسبوع القادم",
        "Priority changes for next week",
      ),
      rating("satisfaction", "الرضا عن الأسبوع", "Satisfaction with the week"),
    ],
  },
  {
    type: "monthly_review",
    name: "Monthly Review",
    schema: [
      textarea("performance", "تحليل الأداء", "Performance analysis"),
      textarea("goal_progress", "تقدم الأهداف", "Goal progress"),
      textarea("habits_review", "مراجعة العادات", "Habits review"),
      list("next_month_focus", "تركيز الشهر القادم", "Next month's focus"),
    ],
  },
  {
    type: "quarterly_review",
    name: "Quarterly Review",
    schema: [
      textarea("direction", "مراجعة الاتجاه العام", "Overall direction review"),
      textarea("goal_adjustments", "تعديل الأهداف", "Goal adjustments"),
      list("keep_doing", "ما نستمر فيه", "Keep doing"),
      list("stop_doing", "ما نتوقف عنه", "Stop doing"),
    ],
  },
  {
    type: "yearly_review",
    name: "Yearly Review",
    schema: [
      textarea("year_analysis", "تحليل السنة", "Year analysis"),
      list("major_wins", "الإنجازات الكبرى", "Major achievements"),
      list("major_lessons", "أهم الدروس", "Key lessons"),
      textarea("next_year_plan", "التخطيط للسنة القادمة", "Plan for next year"),
    ],
  },
  {
    type: "daily_plan",
    name: "Daily Plan",
    schema: [
      textarea("intention", "نية اليوم", "Intention for the day"),
      list("top3", "أهم 3 مهام", "Top 3 tasks"),
      rating("expected_energy", "الطاقة المتوقعة", "Expected energy"),
    ],
  },
];
