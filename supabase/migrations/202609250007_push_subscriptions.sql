create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  prayer_enabled boolean not null default true,
  task_enabled boolean not null default true,
  timezone text not null default 'Africa/Cairo',
  prayer_times jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
drop policy if exists daw_push_select on public.push_subscriptions;
drop policy if exists daw_push_insert on public.push_subscriptions;
drop policy if exists daw_push_update on public.push_subscriptions;
drop policy if exists daw_push_delete on public.push_subscriptions;
create policy daw_push_select on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy daw_push_insert on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy daw_push_update on public.push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy daw_push_delete on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);
