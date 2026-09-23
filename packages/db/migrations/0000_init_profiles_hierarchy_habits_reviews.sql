CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"locale" text DEFAULT 'ar' NOT NULL,
	"timezone" text DEFAULT 'Africa/Cairo' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"accent_color" text DEFAULT 'neutral' NOT NULL,
	"week_starts_on" smallint DEFAULT 6 NOT NULL,
	"current_energy" smallint,
	"priority_weights" jsonb,
	"role" text DEFAULT 'user' NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "areas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"vision_id" uuid,
	"area_id" uuid,
	"parent_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"horizon" text NOT NULL,
	"period_start" date,
	"period_end" date,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" smallint DEFAULT 3 NOT NULL,
	"metric_type" text,
	"metric_target" numeric,
	"metric_current" numeric,
	"manual_progress" numeric,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "progress_cache" (
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"progress" numeric DEFAULT '0' NOT NULL,
	"total_tasks" integer DEFAULT 0 NOT NULL,
	"done_tasks" integer DEFAULT 0 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_cache_entity_type_entity_id_pk" PRIMARY KEY("entity_type","entity_id")
);
--> statement-breakpoint
ALTER TABLE "progress_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"goal_id" uuid,
	"area_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"weight" numeric DEFAULT '1' NOT NULL,
	"start_date" date,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"project_id" uuid,
	"goal_id" uuid,
	"parent_task_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"importance" smallint DEFAULT 3 NOT NULL,
	"urgency" smallint,
	"impact" smallint DEFAULT 3 NOT NULL,
	"difficulty" smallint DEFAULT 3 NOT NULL,
	"energy" text DEFAULT 'medium' NOT NULL,
	"estimate_minutes" integer,
	"actual_minutes" integer,
	"due_date" date,
	"due_time" time,
	"scheduled_date" date,
	"priority_score" numeric,
	"eisenhower" text,
	"recurrence_rule" text,
	"recurrence_parent_id" uuid,
	"completed_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "visions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"title" text NOT NULL,
	"statement" text,
	"horizon_years" smallint DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "habit_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"name" text NOT NULL,
	"kind" text DEFAULT 'general' NOT NULL,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habit_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "habit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"habit_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"value" numeric DEFAULT '1' NOT NULL,
	"completed" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "habit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"category_id" uuid,
	"goal_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"frequency" text NOT NULL,
	"target_count" integer DEFAULT 1 NOT NULL,
	"days_of_week" smallint[],
	"value_type" text DEFAULT 'boolean' NOT NULL,
	"target_value" numeric,
	"difficulty" smallint DEFAULT 3 NOT NULL,
	"impact_score" smallint DEFAULT 3 NOT NULL,
	"reminder_time" time,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"preset" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"template_id" uuid,
	"type" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"mood" smallint,
	"energy" smallint,
	"wins" text[] DEFAULT '{}' NOT NULL,
	"failures" text[] DEFAULT '{}' NOT NULL,
	"lessons" text[] DEFAULT '{}' NOT NULL,
	"snapshot" jsonb,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"schema" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_vision_id_visions_id_fk" FOREIGN KEY ("vision_id") REFERENCES "public"."visions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_parent_id_goals_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurrence_parent_id_tasks_id_fk" FOREIGN KEY ("recurrence_parent_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visions" ADD CONSTRAINT "visions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_categories" ADD CONSTRAINT "habit_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_category_id_habit_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."habit_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "areas_user_idx" ON "areas" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "goals_user_horizon_status_idx" ON "goals" USING btree ("user_id","horizon","status");--> statement-breakpoint
CREATE INDEX "goals_parent_idx" ON "goals" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "progress_cache_user_idx" ON "progress_cache" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_user_idx" ON "projects" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "projects_goal_idx" ON "projects" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "tasks_user_scheduled_idx" ON "tasks" USING btree ("user_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "tasks_user_status_due_idx" ON "tasks" USING btree ("user_id","status","due_date");--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_user_priority_idx" ON "tasks" USING btree ("user_id","priority_score");--> statement-breakpoint
CREATE INDEX "visions_user_idx" ON "visions" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "habit_categories_user_idx" ON "habit_categories" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_logs_habit_date_uq" ON "habit_logs" USING btree ("habit_id","log_date");--> statement-breakpoint
CREATE INDEX "habit_logs_user_date_idx" ON "habit_logs" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE INDEX "habits_user_idx" ON "habits" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_user_type_period_uq" ON "reviews" USING btree ("user_id","type","period_start");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "templates_user_type_idx" ON "templates" USING btree ("user_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "templates_system_type_name_uq" ON "templates" USING btree ("type","name") WHERE "templates"."user_id" IS NULL;--> statement-breakpoint
CREATE POLICY "profiles_owner_all" ON "profiles" AS PERMISSIVE FOR ALL TO "authenticated" USING ("profiles"."id" = (select auth.uid())) WITH CHECK ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "areas_owner_all" ON "areas" AS PERMISSIVE FOR ALL TO "authenticated" USING ("areas"."user_id" = (select auth.uid())) WITH CHECK ("areas"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "goals_owner_all" ON "goals" AS PERMISSIVE FOR ALL TO "authenticated" USING ("goals"."user_id" = (select auth.uid())) WITH CHECK ("goals"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "progress_cache_owner_all" ON "progress_cache" AS PERMISSIVE FOR ALL TO "authenticated" USING ("progress_cache"."user_id" = (select auth.uid())) WITH CHECK ("progress_cache"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "projects_owner_all" ON "projects" AS PERMISSIVE FOR ALL TO "authenticated" USING ("projects"."user_id" = (select auth.uid())) WITH CHECK ("projects"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "tasks_owner_all" ON "tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING ("tasks"."user_id" = (select auth.uid())) WITH CHECK ("tasks"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "visions_owner_all" ON "visions" AS PERMISSIVE FOR ALL TO "authenticated" USING ("visions"."user_id" = (select auth.uid())) WITH CHECK ("visions"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "habit_categories_owner_all" ON "habit_categories" AS PERMISSIVE FOR ALL TO "authenticated" USING ("habit_categories"."user_id" = (select auth.uid())) WITH CHECK ("habit_categories"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "habit_logs_owner_all" ON "habit_logs" AS PERMISSIVE FOR ALL TO "authenticated" USING ("habit_logs"."user_id" = (select auth.uid())) WITH CHECK ("habit_logs"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "habits_owner_all" ON "habits" AS PERMISSIVE FOR ALL TO "authenticated" USING ("habits"."user_id" = (select auth.uid())) WITH CHECK ("habits"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "reviews_owner_all" ON "reviews" AS PERMISSIVE FOR ALL TO "authenticated" USING ("reviews"."user_id" = (select auth.uid())) WITH CHECK ("reviews"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "templates_read_own_or_system" ON "templates" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("templates"."user_id" IS NULL OR "templates"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "templates_insert_own" ON "templates" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("templates"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "templates_update_own" ON "templates" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("templates"."user_id" = (select auth.uid())) WITH CHECK ("templates"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "templates_delete_own" ON "templates" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("templates"."user_id" = (select auth.uid()));