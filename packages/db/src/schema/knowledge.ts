import { boolean, index, pgTable, primaryKey, smallint, text, uuid } from "drizzle-orm/pg-core";
import { ownedColumns, ownerPolicy } from "./_shared";
import { projects } from "./hierarchy";

export const notes = pgTable(
  "notes",
  {
    ...ownedColumns,
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    category: text("category").notNull().default("general"),
    isPinned: boolean("is_pinned").notNull().default(false),
  },
  (t) => [
    index("notes_user_idx").on(t.userId, t.deletedAt),
    index("notes_project_idx").on(t.projectId),
    ownerPolicy("notes", t.userId),
  ],
).enableRLS();

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export const resources = pgTable(
  "resources",
  {
    ...ownedColumns,
    title: text("title").notNull(),
    type: text("type").notNull().default("book"),
    author: text("author"),
    url: text("url"),
    status: text("status").notNull().default("queued"),
    rating: smallint("rating"),
    notes: text("notes"),
  },
  (t) => [
    index("resources_user_idx").on(t.userId, t.deletedAt),
    ownerPolicy("resources", t.userId),
  ],
).enableRLS();

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export const tags = pgTable(
  "tags",
  {
    ...ownedColumns,
    name: text("name").notNull(),
    color: text("color").notNull().default("indigo"),
  },
  (t) => [index("tags_user_name_idx").on(t.userId, t.name), ownerPolicy("tags", t.userId)],
).enableRLS();

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

import { sql } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.noteId, t.tagId] }),
    index("note_tags_tag_idx").on(t.tagId),
    pgPolicy("note_tags_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid()))`,
      withCheck: sql`EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = (select auth.uid()))`,
    }),
  ],
).enableRLS();
