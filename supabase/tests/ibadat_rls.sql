-- Run with `supabase test db` after enabling the pgTAP extension.
-- These checks are intentionally schema-level so they work in a clean project
-- without depending on test users or production data.
select plan(12);

select ok(
  exists (select 1 from pg_class where oid = 'public.worship_definitions'::regclass and relrowsecurity),
  'worship_definitions has RLS enabled'
);
select ok(
  exists (select 1 from pg_class where oid = 'public.worship_logs'::regclass and relrowsecurity),
  'worship_logs has RLS enabled'
);
select ok(
  exists (select 1 from pg_class where oid = 'public.push_subscriptions'::regclass and relrowsecurity),
  'push_subscriptions has RLS enabled'
);
select ok(
  not exists (
    select 1 from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public'
      and table_name in ('worship_definitions', 'worship_logs', 'push_subscriptions')
  ),
  'anon has no direct grants on private worship or push tables'
);
select ok(
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'worship_definitions' and roles @> array['authenticated'::name]) > 0,
  'authenticated has an ownership policy for worship_definitions'
);
select ok(
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'worship_logs' and roles @> array['authenticated'::name]) > 0,
  'authenticated has an ownership policy for worship_logs'
);
select ok(
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and roles @> array['authenticated'::name]) > 0,
  'authenticated has an ownership policy for push_subscriptions'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.worship_logs'::regclass and contype = 'u' and conname like '%user_id%worship_id%date%'),
  'one worship log exists per user, worship, and date'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.worship_logs'::regclass and confrelid = 'public.worship_definitions'::regclass and conname like '%owner%'),
  'worship_logs enforces composite ownership of its definition'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.progression_paths'::regclass and confrelid = 'public.worship_definitions'::regclass and conname like '%owner%'),
  'progression_paths enforces composite ownership of its definition'
);
select ok(
  has_function_privilege('authenticated', 'public.dawenli_save_snapshot(jsonb)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.dawenli_save_snapshot(jsonb)', 'EXECUTE'),
  'snapshot RPC is callable only by authenticated users'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.quran_khatmas'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%604%'),
  'Quran khatma page range is constrained to 604 pages'
);

select * from finish();
