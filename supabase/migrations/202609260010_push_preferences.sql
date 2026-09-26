-- Keep each notification category independently controllable per browser subscription.
alter table public.push_subscriptions
  add column if not exists adhkar_enabled boolean not null default true,
  add column if not exists quran_enabled boolean not null default true,
  add column if not exists qiyam_enabled boolean not null default true,
  add column if not exists sleep_enabled boolean not null default true,
  add column if not exists streak_enabled boolean not null default true;
