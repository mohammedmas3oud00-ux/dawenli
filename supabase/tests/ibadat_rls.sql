-- Plain SQL Ibadat/RLS checks. Run with Supabase SQL editor, Management API, or `supabase db query`.
-- The result contains one row per assertion; every `passed` value must be true.
with checks(name, passed) as (
  select 'worship_definitions has RLS enabled', exists (select 1 from pg_class where oid = 'public.worship_definitions'::regclass and relrowsecurity)
  union all select 'worship_logs has RLS enabled', exists (select 1 from pg_class where oid = 'public.worship_logs'::regclass and relrowsecurity)
  union all select 'push_subscriptions has RLS enabled', exists (select 1 from pg_class where oid = 'public.push_subscriptions'::regclass and relrowsecurity)
  union all select 'anon has no direct grants on private worship or push tables', not exists (
    select 1 from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public'
      and table_name in ('worship_definitions', 'worship_logs', 'push_subscriptions')
  )
  union all select 'authenticated has an ownership policy for worship_definitions', (select count(*) from pg_policies where schemaname = 'public' and tablename = 'worship_definitions' and roles @> array['authenticated'::name]) > 0
  union all select 'authenticated has an ownership policy for worship_logs', (select count(*) from pg_policies where schemaname = 'public' and tablename = 'worship_logs' and roles @> array['authenticated'::name]) > 0
  union all select 'authenticated has an ownership policy for push_subscriptions', (select count(*) from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and roles @> array['authenticated'::name]) > 0
  union all select 'one worship log exists per user, worship, and date', exists (select 1 from pg_constraint where conrelid = 'public.worship_logs'::regclass and contype = 'u' and conname like '%user_id%worship_id%date%')
  union all select 'worship_logs enforces composite ownership of its definition', exists (select 1 from pg_constraint where conrelid = 'public.worship_logs'::regclass and confrelid = 'public.worship_definitions'::regclass and conname like '%owner%')
  union all select 'progression_paths enforces composite ownership of its definition', exists (select 1 from pg_constraint where conrelid = 'public.progression_paths'::regclass and confrelid = 'public.worship_definitions'::regclass and conname like '%owner%')
  union all select 'CAS snapshot RPC is callable only by authenticated users', has_function_privilege('authenticated', 'public.dawenli_save_snapshot(jsonb,bigint)', 'EXECUTE') and not has_function_privilege('anon', 'public.dawenli_save_snapshot(jsonb,bigint)', 'EXECUTE')
  union all select 'Quran khatma page range is constrained to 604 pages', exists (select 1 from pg_constraint where conrelid = 'public.quran_khatmas'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%604%')
)
select name, passed
from checks
order by name;
