-- Keep hosted projects that predate the push-preferences migration compatible with the API.
-- Additive and re-runnable; existing subscriptions retain their current behavior.
alter table public.push_subscriptions
  add column if not exists worship_enabled boolean not null default true,
  add column if not exists adhkar_enabled boolean not null default true,
  add column if not exists quran_enabled boolean not null default true,
  add column if not exists qiyam_enabled boolean not null default true,
  add column if not exists sleep_enabled boolean not null default true,
  add column if not exists streak_enabled boolean not null default true;
