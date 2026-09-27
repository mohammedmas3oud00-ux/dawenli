-- Additive: no existing worship records or logs are removed.
alter table public.worship_definitions
  add column if not exists scheduled_hijri_days jsonb default '[]'::jsonb;
alter table public.worship_definitions
  add column if not exists progression_days integer default 30 check (progression_days between 1 and 365);
