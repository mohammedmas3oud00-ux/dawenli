import type { HabitCategoryKind, Locale } from "@bawsala/core";

export interface DefaultHabitCategory {
  key: string;
  kind: HabitCategoryKind;
  icon: string;
  name: Record<Locale, string>;
}

/**
 * Categories created for every new user (docs/database-schema.md §3.3).
 * Users can rename, reorder or delete them freely afterwards.
 */
export const DEFAULT_HABIT_CATEGORIES: readonly DefaultHabitCategory[] = [
  { key: "health", kind: "general", icon: "heart-pulse", name: { ar: "صحة", en: "Health" } },
  { key: "learning", kind: "general", icon: "book-open", name: { ar: "تعلم", en: "Learning" } },
  { key: "work", kind: "general", icon: "briefcase", name: { ar: "عمل", en: "Work" } },
  { key: "relations", kind: "general", icon: "users", name: { ar: "علاقات", en: "Relationships" } },
  { key: "quran", kind: "spiritual", icon: "book", name: { ar: "قرآن", en: "Quran" } },
  { key: "prayer", kind: "spiritual", icon: "moon", name: { ar: "صلاة", en: "Prayer" } },
  { key: "adhkar", kind: "spiritual", icon: "sparkles", name: { ar: "أذكار", en: "Adhkar" } },
  {
    key: "reflection",
    kind: "spiritual",
    icon: "brain",
    name: { ar: "تأمل وتفكر", en: "Reflection" },
  },
];

export function defaultHabitCategoryRows(userId: string, locale: Locale) {
  return DEFAULT_HABIT_CATEGORIES.map((c, i) => ({
    userId,
    name: c.name[locale],
    kind: c.kind,
    icon: c.icon,
    sortOrder: i,
  }));
}
