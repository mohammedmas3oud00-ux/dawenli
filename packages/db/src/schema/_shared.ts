import { sql } from "drizzle-orm";
import { pgPolicy, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

/** Audit columns present on every table (see docs/database-schema.md §1). */
export const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/** `id` + `user_id` + audit columns — the standard shape of an owned row. */
export const ownedColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  ...auditColumns,
};

/**
 * Standard RLS policy: the authenticated owner can do everything on their rows.
 * Usage: `(t) => [ownerPolicy("tasks", t.userId)]`.
 */
export function ownerPolicy(table: string, userIdColumn: AnyPgColumn) {
  return pgPolicy(`${table}_owner_all`, {
    for: "all",
    to: authenticatedRole,
    using: sql`${userIdColumn} = ${authUid}`,
    withCheck: sql`${userIdColumn} = ${authUid}`,
  });
}
