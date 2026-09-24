import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, Code2 } from 'lucide-react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sqlCode = `-- ==============================================================================
-- PERSONAL PRODUCTIVITY SYSTEM (PERSONAL OS)
-- HIERARCHY: Pillars -> Visions -> Value Goals -> Projects -> Tasks
-- PostgreSQL Schema with Row Level Security (RLS) & Automatic Bottom-Up Rollup
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES DEFINITION
CREATE TABLE IF NOT EXISTS public.pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    pillar_group TEXT NOT NULL DEFAULT 'Growth',
    purpose TEXT NOT NULL DEFAULT '',
    priority INTEGER NOT NULL DEFAULT 1,
    show_on_home BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    progress NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress >= 0.00 AND progress <= 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pillar_id UUID NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    timeframe TEXT DEFAULT '3-5 سنوات',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    progress NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress >= 0.00 AND progress <= 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- 3. ROW LEVEL SECURITY
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.value_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pillars user policy" ON public.pillars FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Visions user policy" ON public.visions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Value goals user policy" ON public.value_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Projects user policy" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Tasks user policy" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- 4. CASCADE PROGRESS ROLLUP (Task -> Project -> Goal -> Vision -> Pillar)
CREATE OR REPLACE FUNCTION public.recalculate_project_progress(target_project_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_prog NUMERIC(5,2);
    parent_goal_id UUID;
BEGIN
    SELECT COALESCE(ROUND(AVG(CASE WHEN status = 'done' THEN 100.00 ELSE 0.00 END), 2), 0.00)
    INTO avg_prog
    FROM public.tasks WHERE project_id = target_project_id;

    UPDATE public.projects
    SET progress = avg_prog, status = CASE WHEN avg_prog >= 100.00 THEN 'completed' ELSE status END, updated_at = now()
    WHERE id = target_project_id
    RETURNING goal_id INTO parent_goal_id;

    IF parent_goal_id IS NOT NULL THEN
        PERFORM public.recalculate_value_goal_progress(parent_goal_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
FOR EACH ROW EXECUTE FUNCTION public.trg_tasks_cascade();

-- 6. SYSTEM REVIEWS TABLE (Daily, Weekly, Monthly, Quarterly, Yearly)
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

ALTER TABLE public.system_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own reviews" ON public.system_reviews FOR ALL USING (auth.uid() = user_id);

-- 7. GTD INBOX TABLE (Quick Capture & Clarify)
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
CREATE POLICY "Users can manage their own inbox" ON public.inbox_items FOR ALL USING (auth.uid() = user_id);

-- 8. PPV HABITS TABLE (Pillars Consistency)
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
CREATE POLICY "Users can manage their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

-- 9. PPV VAULTS TABLE (Knowledge & Books)
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
CREATE POLICY "Users can manage their own vaults" ON public.vault_items FOR ALL USING (auth.uid() = user_id);

`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 text-slate-100 rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ebf4f0]/20 text-[#34d399] flex items-center justify-center border border-[#34d399]/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Supabase / PostgreSQL SQL Schema & Cascade Triggers
              </h3>
              <p className="text-[11px] text-slate-400">
                مخطط قواعد البيانات المتكامل مع سياسات RLS ودوال الحساب التلقائي الصاعد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#174235] hover:bg-[#1f5645] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#2d735d]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ بنجاح' : 'نسخ كود SQL'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 bg-slate-950 leading-relaxed selection:bg-indigo-600 selection:text-white">
          <pre>{sqlCode}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>ملف المخطط متوفر أيضاً في المسار: /supabase/schema.sql</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-slate-300 hover:text-white rounded"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
