-- ==============================================================================
-- PERSONAL PRODUCTIVITY SYSTEM (PERSONAL OS)
-- HIERARCHY: Pillars -> Visions -> Value Goals -> Projects -> Tasks
-- PostgreSQL Schema with Row Level Security (RLS) & Automatic Bottom-Up Rollup
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES DEFINITION
-- ==============================================================================

-- 2.1 PILLARS TABLE (Top-level life area, e.g. "العلاقة مع الله", "بناء الذات")
CREATE TABLE IF NOT EXISTS public.pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    pillar_group TEXT NOT NULL DEFAULT 'Growth', -- e.g. 'Growth', 'Vitality', 'Impact', 'Wealth'
    purpose TEXT NOT NULL DEFAULT '',           -- The pillar's "big why" guiding statement
    priority INTEGER NOT NULL DEFAULT 1,        -- Priority ordering (1 = highest)
    show_on_home BOOLEAN NOT NULL DEFAULT true, -- Whether featured on dashboard
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    progress NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress >= 0.00 AND progress <= 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 VISIONS TABLE (Strategic vision horizon under a Pillar)
CREATE TABLE IF NOT EXISTS public.visions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pillar_id UUID NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',                -- Vision narrative / future picture
    timeframe TEXT DEFAULT '3-5 سنوات',          -- Horizon e.g. '2026-2030'
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    progress NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress >= 0.00 AND progress <= 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 VALUE GOALS TABLE (Goal under a Vision or directly under a Pillar)
CREATE TABLE IF NOT EXISTS public.value_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pillar_id UUID NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
    vision_id UUID REFERENCES public.visions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    target_date DATE,
    progress NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress >= 0.00 AND progress <= 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 PROJECTS TABLE (Initiative under a ValueGoal)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.value_goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
    progress NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress >= 0.00 AND progress <= 100.00),
    start_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 TASKS TABLE (Actionable item under a Project)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_pillars_user_id ON public.pillars(user_id);
CREATE INDEX IF NOT EXISTS idx_visions_user_id ON public.visions(user_id);
CREATE INDEX IF NOT EXISTS idx_visions_pillar_id ON public.visions(pillar_id);
CREATE INDEX IF NOT EXISTS idx_value_goals_user_id ON public.value_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_value_goals_pillar_id ON public.value_goals(pillar_id);
CREATE INDEX IF NOT EXISTS idx_value_goals_vision_id ON public.value_goals(vision_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_goal_id ON public.projects(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4.1 Pillars Policies
DROP POLICY IF EXISTS "Users can view their own pillars" ON public.pillars;
CREATE POLICY "Users can view their own pillars"
    ON public.pillars FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own pillars" ON public.pillars;
CREATE POLICY "Users can insert their own pillars"
    ON public.pillars FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own pillars" ON public.pillars;
CREATE POLICY "Users can update their own pillars"
    ON public.pillars FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own pillars" ON public.pillars;
CREATE POLICY "Users can delete their own pillars"
    ON public.pillars FOR DELETE USING (auth.uid() = user_id);

-- 4.2 Visions Policies
DROP POLICY IF EXISTS "Users can view their own visions" ON public.visions;
CREATE POLICY "Users can view their own visions"
    ON public.visions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own visions" ON public.visions;
CREATE POLICY "Users can insert their own visions"
    ON public.visions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own visions" ON public.visions;
CREATE POLICY "Users can update their own visions"
    ON public.visions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own visions" ON public.visions;
CREATE POLICY "Users can delete their own visions"
    ON public.visions FOR DELETE USING (auth.uid() = user_id);

-- 4.3 Value Goals Policies
DROP POLICY IF EXISTS "Users can view their own goals" ON public.value_goals;
CREATE POLICY "Users can view their own goals"
    ON public.value_goals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.value_goals;
CREATE POLICY "Users can insert their own goals"
    ON public.value_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own goals" ON public.value_goals;
CREATE POLICY "Users can update their own goals"
    ON public.value_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.value_goals;
CREATE POLICY "Users can delete their own goals"
    ON public.value_goals FOR DELETE USING (auth.uid() = user_id);

-- 4.4 Projects Policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects"
    ON public.projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects"
    ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects"
    ON public.projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects"
    ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- 4.5 Tasks Policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
CREATE POLICY "Users can insert their own tasks"
    ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks"
    ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. BOTTOM-UP PROGRESS ROLLUP TRIGGER FUNCTIONS
-- Logic:
--   Task: done = 100%, else 0%
--   Project: AVG of Tasks
--   ValueGoal: AVG of Projects
--   Vision: AVG of ValueGoals
--   Pillar: AVG of Visions (or AVG of ValueGoals)
-- ==============================================================================

-- 5.1 Recalculate Pillar Progress
CREATE OR REPLACE FUNCTION public.recalculate_pillar_progress(target_pillar_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_prog NUMERIC(5,2);
    vision_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vision_count
    FROM public.visions
    WHERE pillar_id = target_pillar_id;

    IF vision_count > 0 THEN
        SELECT COALESCE(ROUND(AVG(progress), 2), 0.00)
        INTO avg_prog
        FROM public.visions
        WHERE pillar_id = target_pillar_id;
    ELSE
        SELECT COALESCE(ROUND(AVG(progress), 2), 0.00)
        INTO avg_prog
        FROM public.value_goals
        WHERE pillar_id = target_pillar_id;
    END IF;

    UPDATE public.pillars
    SET progress = avg_prog,
        updated_at = now()
    WHERE id = target_pillar_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Recalculate Vision Progress
CREATE OR REPLACE FUNCTION public.recalculate_vision_progress(target_vision_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_prog NUMERIC(5,2);
    parent_pillar_id UUID;
BEGIN
    SELECT COALESCE(ROUND(AVG(progress), 2), 0.00)
    INTO avg_prog
    FROM public.value_goals
    WHERE vision_id = target_vision_id;

    UPDATE public.visions
    SET progress = avg_prog,
        updated_at = now()
    WHERE id = target_vision_id
    RETURNING pillar_id INTO parent_pillar_id;

    IF parent_pillar_id IS NOT NULL THEN
        PERFORM public.recalculate_pillar_progress(parent_pillar_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Recalculate ValueGoal Progress
CREATE OR REPLACE FUNCTION public.recalculate_value_goal_progress(target_goal_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_prog NUMERIC(5,2);
    parent_vision_id UUID;
    parent_pillar_id UUID;
BEGIN
    SELECT COALESCE(ROUND(AVG(progress), 2), 0.00)
    INTO avg_prog
    FROM public.projects
    WHERE goal_id = target_goal_id;

    UPDATE public.value_goals
    SET progress = avg_prog,
        status = CASE
            WHEN avg_prog >= 100.00 THEN 'completed'
            WHEN avg_prog > 0.00 AND status = 'not_started' THEN 'in_progress'
            ELSE status
        END,
        updated_at = now()
    WHERE id = target_goal_id
    RETURNING vision_id, pillar_id INTO parent_vision_id, parent_pillar_id;

    IF parent_vision_id IS NOT NULL THEN
        PERFORM public.recalculate_vision_progress(parent_vision_id);
    ELSIF parent_pillar_id IS NOT NULL THEN
        PERFORM public.recalculate_pillar_progress(parent_pillar_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Recalculate Project Progress
CREATE OR REPLACE FUNCTION public.recalculate_project_progress(target_project_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_prog NUMERIC(5,2);
    parent_goal_id UUID;
BEGIN
    SELECT COALESCE(
        ROUND(AVG(CASE WHEN status = 'done' THEN 100.00 ELSE 0.00 END), 2),
        0.00
    )
    INTO avg_prog
    FROM public.tasks
    WHERE project_id = target_project_id;

    UPDATE public.projects
    SET progress = avg_prog,
        status = CASE
            WHEN avg_prog >= 100.00 THEN 'completed'
            ELSE status
        END,
        updated_at = now()
    WHERE id = target_project_id
    RETURNING goal_id INTO parent_goal_id;

    IF parent_goal_id IS NOT NULL THEN
        PERFORM public.recalculate_value_goal_progress(parent_goal_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Task Cascade Trigger
CREATE OR REPLACE FUNCTION public.trg_tasks_cascade()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.recalculate_project_progress(OLD.project_id);
        RETURN OLD;
    ELSE
        IF (TG_OP = 'UPDATE' AND NEW.status = 'done' AND OLD.status <> 'done' AND NEW.completed_at IS NULL) THEN
            NEW.completed_at = now();
        ELSIF (TG_OP = 'UPDATE' AND NEW.status <> 'done') THEN
            NEW.completed_at = NULL;
        END IF;

        PERFORM public.recalculate_project_progress(NEW.project_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_task_cascade_rollup ON public.tasks;
CREATE TRIGGER trigger_task_cascade_rollup
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.trg_tasks_cascade();

-- ==============================================================================
-- 6. SYSTEM REVIEWS TABLE (Daily, Weekly, Monthly, Quarterly, Yearly Reviews)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 8 CHECK (rating >= 1 AND rating <= 10),
    focus_pillar_id UUID REFERENCES public.pillars(id) ON DELETE SET NULL,
    wins TEXT DEFAULT '',
    challenges TEXT DEFAULT '',
    lessons TEXT DEFAULT '',
    next_commitments TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    snapshot JSONB DEFAULT '{}'::jsonb,
    system_health_score NUMERIC(5,2) DEFAULT 80.00,
    smart_summary TEXT DEFAULT '',
    strengths TEXT[] DEFAULT '{}',
    bottlenecks TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    action_items JSONB DEFAULT '[]'::jsonb,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for system_reviews
ALTER TABLE public.system_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reviews" ON public.system_reviews;
CREATE POLICY "Users can view their own reviews"
    ON public.system_reviews FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own reviews" ON public.system_reviews;
CREATE POLICY "Users can create their own reviews"
    ON public.system_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.system_reviews;
CREATE POLICY "Users can update their own reviews"
    ON public.system_reviews FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.system_reviews;
CREATE POLICY "Users can delete their own reviews"
    ON public.system_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. GTD INBOX TABLE (Quick Capture & Clarification)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    source_type TEXT NOT NULL DEFAULT 'idea' CHECK (source_type IN ('idea', 'task_seed', 'reference', 'question', 'link')),
    url TEXT,
    status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'processed', 'archived')),
    converted_to TEXT CHECK (converted_to IN ('task', 'vault', 'habit')),
    converted_entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own inbox" ON public.inbox_items;
CREATE POLICY "Users can manage their own inbox" ON public.inbox_items FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 8. PPV HABITS TABLE (Habit Tracker & Consistency Tied to Pillars)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pillar_id UUID NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'custom_days')),
    target_days_per_week INTEGER NOT NULL DEFAULT 7 CHECK (target_days_per_week >= 1 AND target_days_per_week <= 7),
    completed_dates DATE[] DEFAULT '{}',
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    time_of_day TEXT NOT NULL DEFAULT 'morning' CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'anytime')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;
CREATE POLICY "Users can manage their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 9. PPV VAULTS TABLE (Knowledge & Resource Depository Tied to Pillars)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pillar_id UUID NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    vault_type TEXT NOT NULL DEFAULT 'notes' CHECK (vault_type IN ('books', 'notes', 'resources', 'templates')),
    author_or_source TEXT,
    url TEXT,
    summary TEXT DEFAULT '',
    content TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own vaults" ON public.vault_items;
CREATE POLICY "Users can manage their own vaults" ON public.vault_items FOR ALL USING (auth.uid() = user_id);


