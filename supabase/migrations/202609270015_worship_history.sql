-- Preserve the scoring rules that applied before a user changed a target or schedule.
alter table public.worship_definitions
  add column if not exists settings_history jsonb default '[]'::jsonb;
