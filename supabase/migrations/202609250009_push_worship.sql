alter table public.push_subscriptions add column if not exists worship_enabled boolean not null default true;
