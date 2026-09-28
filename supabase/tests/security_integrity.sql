-- Plain SQL security checks. Run with Supabase SQL editor, Management API, or `supabase db query`.
-- The result contains one row per assertion; every `passed` value must be true.
with checks(name, passed) as (
  select 'snapshot revision table exists', to_regclass('public.snapshot_revisions') is not null
  union all select 'server-only Google OAuth state table exists', to_regclass('public.google_oauth_states') is not null
  union all select 'server-only Google sync lock table exists', to_regclass('public.google_sync_locks') is not null
  union all select 'distributed AI quota table exists', to_regclass('public.ai_rate_limits') is not null
  union all select 'new server-only tables have RLS enabled', not exists (
    select 1 from pg_class
    where oid in (
      'public.snapshot_revisions'::regclass,
      'public.google_oauth_states'::regclass,
      'public.google_sync_locks'::regclass,
      'public.ai_rate_limits'::regclass
    ) and not relrowsecurity
  )
  union all select 'every public user-owned table has RLS enabled', not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not c.relrowsecurity
      and exists (
        select 1 from information_schema.columns x
        where x.table_schema = 'public' and x.table_name = c.relname and x.column_name = 'user_id'
      )
  )
  union all select 'anonymous role has no direct grants on public tables', not exists (
    select 1 from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public'
  )
  union all select 'browser roles have no direct grants on server-only state', not exists (
    select 1 from information_schema.role_table_grants
    where grantee in ('anon', 'authenticated')
      and table_schema = 'public'
      and table_name in (
        'snapshot_revisions', 'google_oauth_states', 'google_sync_locks', 'ai_rate_limits',
        'google_calendar_connections', 'google_calendar_event_links'
      )
  )
  union all select 'internal SECURITY DEFINER helpers are not callable by browser roles', not exists (
    select 1
    from pg_proc p
    cross join (values ('anon'::name), ('authenticated'::name)) as r(role_name)
    where p.pronamespace = 'public'::regnamespace
      and p.proname in (
        'recalculate_pillar_progress', 'recalculate_vision_progress',
        'recalculate_value_goal_progress', 'recalculate_project_progress',
        'trg_tasks_cascade', 'dawenli_recalculate_pillar',
        'dawenli_recalculate_vision', 'dawenli_recalculate_goal',
        'dawenli_recalculate_project', 'dawenli_task_rollup',
        'dawenli_project_rollup', 'dawenli_goal_rollup', 'dawenli_vision_rollup',
        'dawenli_write_snapshot_locked'
      )
      and has_function_privilege(r.role_name, p.oid, 'EXECUTE')
  )
  union all select 'legacy blind snapshot RPC is revoked',
    not has_function_privilege('authenticated', 'public.dawenli_save_snapshot(jsonb)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.dawenli_save_snapshot(jsonb)', 'EXECUTE')
  union all select 'CAS snapshot RPC is authenticated-only',
    has_function_privilege('authenticated', 'public.dawenli_save_snapshot(jsonb,bigint)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.dawenli_save_snapshot(jsonb,bigint)', 'EXECUTE')
  union all select 'snapshot revision RPC is authenticated-only',
    has_function_privilege('authenticated', 'public.dawenli_get_snapshot_revision()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.dawenli_get_snapshot_revision()', 'EXECUTE')
  union all select 'CAS snapshot RPC is SECURITY DEFINER with a fixed search_path',
    (select prosecdef from pg_proc where oid = 'public.dawenli_save_snapshot(jsonb,bigint)'::regprocedure)
    and coalesce((select proconfig @> array['search_path=public, pg_temp'] from pg_proc where oid = 'public.dawenli_save_snapshot(jsonb,bigint)'::regprocedure), false)
  union all select 'snapshot revisions cannot be negative', exists (
    select 1 from pg_constraint
    where conrelid = 'public.snapshot_revisions'::regclass
      and contype = 'c' and pg_get_constraintdef(oid) like '%revision >= 0%'
  )
  union all select 'every Ibadat relationship has a composite ownership FK', (
    select count(*)::integer from pg_constraint
    where conname in (
      'worship_logs_owner_definition_fkey', 'progression_paths_owner_definition_fkey',
      'worship_definitions_pillar_owner_fk', 'worship_definitions_vision_owner_fk',
      'worship_definitions_goal_owner_fk', 'quran_khatmas_owner_definition_fk',
      'quran_hifz_owner_definition_fk', 'quran_hifz_pillar_owner_fk',
      'quran_hifz_vision_owner_fk', 'quran_hifz_goal_owner_fk',
      'sleep_schedules_pillar_owner_fk', 'sleep_schedules_qiyam_path_owner_fk'
    ) and contype = 'f'
  ) = 12
  union all select 'required Ibadat ownership links cascade on parent deletion', (
    select count(*)::integer from pg_constraint
    where conname in (
      'worship_logs_owner_definition_fkey', 'progression_paths_owner_definition_fkey',
      'worship_definitions_pillar_owner_fk', 'quran_khatmas_owner_definition_fk',
      'quran_hifz_pillar_owner_fk', 'sleep_schedules_pillar_owner_fk',
      'quran_hifz_owner_definition_fk'
    ) and confdeltype = 'c'
  ) = 7
  union all select 'optional Ibadat FKs null only the relationship column', (
    select count(*)::integer
    from pg_constraint c
    join (values
      ('worship_definitions_vision_owner_fk', 'vision_id'),
      ('worship_definitions_goal_owner_fk', 'goal_id'),
      ('quran_hifz_vision_owner_fk', 'vision_id'),
      ('quran_hifz_goal_owner_fk', 'goal_id'),
      ('sleep_schedules_qiyam_path_owner_fk', 'linked_qiyam_path_id')
    ) expected(name, nullable_column) on expected.name = c.conname
    where c.confdeltype = 'n'
      and position(format('ON DELETE SET NULL (%s)', expected.nullable_column) in pg_get_constraintdef(c.oid)) > 0
  ) = 5
  union all select 'all composite SET NULL FKs preserve user_id', (
    select count(*)::integer
    from pg_constraint c
    join (values
      ('goals_vision_owner_fk', 'vision_id'), ('vaults_project_owner_fk', 'project_id'),
      ('reviews_pillar_owner_fk', 'focus_pillar_id'), ('focus_task_owner_fk', 'task_id'),
      ('blocks_task_owner_fk', 'task_id'), ('journal_pillar_owner_fk', 'pillar_id'),
      ('journal_project_owner_fk', 'project_id'), ('calendar_task_owner_fk', 'task_id'),
      ('calendar_project_owner_fk', 'project_id'), ('calendar_pillar_owner_fk', 'pillar_id')
    ) expected(name, nullable_column) on expected.name = c.conname
    where c.confdeltype = 'n'
      and position(format('ON DELETE SET NULL (%s)', expected.nullable_column) in pg_get_constraintdef(c.oid)) > 0
  ) = 10
  union all select 'Google event links cascade with their connection', exists (
    select 1 from pg_constraint
    where conname = 'google_calendar_links_connection_fk'
      and conrelid = 'public.google_calendar_event_links'::regclass
      and confrelid = 'public.google_calendar_connections'::regclass
      and confdeltype = 'c'
  )
  union all select 'Google links require a same-owner calendar event and cascade with it', exists (
    select 1 from pg_constraint
    where conname = 'google_calendar_links_event_owner_fk'
      and conrelid = 'public.google_calendar_event_links'::regclass
      and confrelid = 'public.calendar_events'::regclass
      and confdeltype = 'c'
  )
  union all select 'Google OAuth state contains nonce ownership and expiry fields',
    coalesce((select array_agg(column_name::text order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'google_oauth_states'), '{}'::text[]) @> array['nonce_hash', 'user_id', 'expires_at', 'created_at']
  union all select 'Google sync lock contains owner and lease fields',
    coalesce((select array_agg(column_name::text order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'google_sync_locks'), '{}'::text[]) @> array['user_id', 'locked_until', 'created_at']
  union all select 'distributed AI quota RPC is service-role-only',
    has_function_privilege('service_role', 'public.dawenli_consume_ai_quota(uuid,integer)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.dawenli_consume_ai_quota(uuid,integer)', 'EXECUTE')
    and not has_function_privilege('anon', 'public.dawenli_consume_ai_quota(uuid,integer)', 'EXECUTE')
)
select name, passed
from checks
order by name;
