import { sql } from "drizzle-orm";
import { jsonb, pgPolicy, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";
import type { PriorityWeights } from "@bawsala/core";
import { auditColumns } from "./_shared";

/**
 * One row per auth user. `id` mirrors `auth.users.id`; created by the
 * `handle_new_user` trigger (see migrations/*_functions_and_triggers.sql).
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    locale: text("locale").notNull().default("ar"),
    timezone: text("timezone").notNull().default("Africa/Cairo"),
    theme: text("theme").notNull().default("system"),
    accentColor: text("accent_color").notNull().default("neutral"),
    weekStartsOn: smallint("week_starts_on").notNull().default(6),
    currentEnergy: smallint("current_energy"),
    priorityWeights: jsonb("priority_weights").$type<PriorityWeights>(),
    role: text("role").notNull().default("user"),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    ...auditColumns,
  },
  (t) => [
    pgPolicy("profiles_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.id} = ${authUid}`,
      withCheck: sql`${t.id} = ${authUid}`,
    }),
  ],
).enableRLS();

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
