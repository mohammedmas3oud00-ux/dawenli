CREATE TABLE IF NOT EXISTS "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"task_id" uuid REFERENCES "tasks"("id") ON DELETE SET NULL,
	"project_id" uuid REFERENCES "projects"("id") ON DELETE SET NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_minutes" integer NOT NULL,
	"mode" text DEFAULT 'pomodoro' NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "time_entries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_entries_user_started_idx" ON "time_entries" ("user_id", "started_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_entries_task_idx" ON "time_entries" ("task_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_entries_project_idx" ON "time_entries" ("project_id");
--> statement-breakpoint
CREATE POLICY "time_entries_owner_all" ON "time_entries" AS PERMISSIVE FOR ALL TO "authenticated" USING ("time_entries"."user_id" = (select auth.uid())) WITH CHECK ("time_entries"."user_id" = (select auth.uid()));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"project_id" uuid REFERENCES "projects"("id") ON DELETE SET NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notes_user_idx" ON "notes" ("user_id", "deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notes_project_idx" ON "notes" ("project_id");
--> statement-breakpoint
CREATE POLICY "notes_owner_all" ON "notes" AS PERMISSIVE FOR ALL TO "authenticated" USING ("notes"."user_id" = (select auth.uid())) WITH CHECK ("notes"."user_id" = (select auth.uid()));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"title" text NOT NULL,
	"type" text DEFAULT 'book' NOT NULL,
	"author" text,
	"url" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"rating" smallint,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "resources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_user_idx" ON "resources" ("user_id", "deleted_at");
--> statement-breakpoint
CREATE POLICY "resources_owner_all" ON "resources" AS PERMISSIVE FOR ALL TO "authenticated" USING ("resources"."user_id" = (select auth.uid())) WITH CHECK ("resources"."user_id" = (select auth.uid()));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"name" text NOT NULL,
	"color" text DEFAULT 'indigo' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_user_name_idx" ON "tags" ("user_id", "name");
--> statement-breakpoint
CREATE POLICY "tags_owner_all" ON "tags" AS PERMISSIVE FOR ALL TO "authenticated" USING ("tags"."user_id" = (select auth.uid())) WITH CHECK ("tags"."user_id" = (select auth.uid()));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "note_tags" (
	"note_id" uuid NOT NULL REFERENCES "notes"("id") ON DELETE CASCADE,
	"tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
	PRIMARY KEY ("note_id", "tag_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_tags_tag_idx" ON "note_tags" ("tag_id");
--> statement-breakpoint
ALTER TABLE "note_tags" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "note_tags_owner_all" ON "note_tags" AS PERMISSIVE FOR ALL TO "authenticated"
USING (EXISTS (SELECT 1 FROM "notes" WHERE "notes"."id" = "note_tags"."note_id" AND "notes"."user_id" = (select auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM "notes" WHERE "notes"."id" = "note_tags"."note_id" AND "notes"."user_id" = (select auth.uid())));
--> statement-breakpoint

do $$
declare
  t text;
begin
  foreach t in array array['time_entries', 'notes', 'resources', 'tags'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end
$$;
