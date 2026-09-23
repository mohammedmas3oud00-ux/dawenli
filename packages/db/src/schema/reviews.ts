import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";
import type { TemplateField } from "@bawsala/core";
import { auditColumns, ownedColumns, ownerPolicy } from "./_shared";

/**
 * Templates: `user_id IS NULL` marks a system template readable by everyone;
 * users can only write their own.
 */
export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    name: text("name").notNull(),
    schema: jsonb("schema").$type<TemplateField[]>().notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    ...auditColumns,
  },
  (t) => [
    index("templates_user_type_idx").on(t.userId, t.type),
    // System templates are upserted by the seed script on (type, name).
    uniqueIndex("templates_system_type_name_uq")
      .on(t.type, t.name)
      .where(sql`${t.userId} IS NULL`),
    pgPolicy("templates_read_own_or_system", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} IS NULL OR ${t.userId} = ${authUid}`,
    }),
    pgPolicy("templates_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${t.userId} = ${authUid}`,
    }),
    pgPolicy("templates_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
      withCheck: sql`${t.userId} = ${authUid}`,
    }),
    pgPolicy("templates_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export const reviews = pgTable(
  "reviews",
  {
    ...ownedColumns,
    templateId: uuid("template_id").references(() => templates.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    answers: jsonb("answers").$type<Record<string, unknown>>().notNull().default({}),
    mood: smallint("mood"),
    energy: smallint("energy"),
    wins: text("wins").array().notNull().default([]),
    failures: text("failures").array().notNull().default([]),
    lessons: text("lessons").array().notNull().default([]),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("reviews_user_type_period_uq").on(t.userId, t.type, t.periodStart),
    index("reviews_user_idx").on(t.userId, t.deletedAt),
    ownerPolicy("reviews", t.userId),
  ],
).enableRLS();

export type Template = typeof templates.$inferSelect;
export type Review = typeof reviews.$inferSelect;
