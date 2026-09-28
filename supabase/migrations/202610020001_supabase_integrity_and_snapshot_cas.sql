-- Harden helper functions, ownership links, and snapshot concurrency without rewriting legacy rows.

-- SECURITY DEFINER trigger/rollup helpers are internal implementation details, not RPCs.
revoke all on function public.recalculate_pillar_progress(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_vision_progress(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_value_goal_progress(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_project_progress(uuid) from public, anon, authenticated;
revoke all on function public.trg_tasks_cascade() from public, anon, authenticated;
revoke all on function public.dawenli_recalculate_pillar(uuid) from public, anon, authenticated;
revoke all on function public.dawenli_recalculate_vision(uuid) from public, anon, authenticated;
revoke all on function public.dawenli_recalculate_goal(uuid) from public, anon, authenticated;
revoke all on function public.dawenli_recalculate_project(uuid) from public, anon, authenticated;
revoke all on function public.dawenli_task_rollup() from public, anon, authenticated;
revoke all on function public.dawenli_project_rollup() from public, anon, authenticated;
revoke all on function public.dawenli_goal_rollup() from public, anon, authenticated;
revoke all on function public.dawenli_vision_rollup() from public, anon, authenticated;

-- A composite SET NULL must clear only the nullable relationship column, never user_id.
alter table public.value_goals drop constraint if exists goals_vision_owner_fk;
alter table public.value_goals add constraint goals_vision_owner_fk
  foreign key (vision_id, user_id) references public.visions(id, user_id)
  on delete set null (vision_id) not valid;

alter table public.vault_items drop constraint if exists vaults_project_owner_fk;
alter table public.vault_items add constraint vaults_project_owner_fk
  foreign key (project_id, user_id) references public.projects(id, user_id)
  on delete set null (project_id) not valid;

alter table public.system_reviews drop constraint if exists reviews_pillar_owner_fk;
alter table public.system_reviews add constraint reviews_pillar_owner_fk
  foreign key (focus_pillar_id, user_id) references public.pillars(id, user_id)
  on delete set null (focus_pillar_id) not valid;

alter table public.focus_sessions drop constraint if exists focus_task_owner_fk;
alter table public.focus_sessions add constraint focus_task_owner_fk
  foreign key (task_id, user_id) references public.tasks(id, user_id)
  on delete set null (task_id) not valid;

alter table public.time_blocks drop constraint if exists blocks_task_owner_fk;
alter table public.time_blocks add constraint blocks_task_owner_fk
  foreign key (task_id, user_id) references public.tasks(id, user_id)
  on delete set null (task_id) not valid;

alter table public.journal_entries drop constraint if exists journal_pillar_owner_fk;
alter table public.journal_entries add constraint journal_pillar_owner_fk
  foreign key (pillar_id, user_id) references public.pillars(id, user_id)
  on delete set null (pillar_id) not valid;
alter table public.journal_entries drop constraint if exists journal_project_owner_fk;
alter table public.journal_entries add constraint journal_project_owner_fk
  foreign key (project_id, user_id) references public.projects(id, user_id)
  on delete set null (project_id) not valid;

alter table public.calendar_events drop constraint if exists calendar_task_owner_fk;
alter table public.calendar_events add constraint calendar_task_owner_fk
  foreign key (task_id, user_id) references public.tasks(id, user_id)
  on delete set null (task_id) not valid;
alter table public.calendar_events drop constraint if exists calendar_project_owner_fk;
alter table public.calendar_events add constraint calendar_project_owner_fk
  foreign key (project_id, user_id) references public.projects(id, user_id)
  on delete set null (project_id) not valid;
alter table public.calendar_events drop constraint if exists calendar_pillar_owner_fk;
alter table public.calendar_events add constraint calendar_pillar_owner_fk
  foreign key (pillar_id, user_id) references public.pillars(id, user_id)
  on delete set null (pillar_id) not valid;

-- Complete ownership-preserving Ibadat relationships. NOT VALID preserves any legacy mismatch
-- while enforcing ownership and lifecycle actions for every new or changed row.
create unique index if not exists worship_definitions_owner_id on public.worship_definitions(user_id, id);
create unique index if not exists progression_paths_owner_id on public.progression_paths(user_id, id);

alter table public.worship_logs drop constraint if exists worship_logs_worship_id_fkey;
alter table public.progression_paths drop constraint if exists progression_paths_worship_id_fkey;
alter table public.quran_khatmas drop constraint if exists quran_khatmas_worship_id_fkey;
alter table public.quran_hifz_trackers drop constraint if exists quran_hifz_trackers_worship_id_fkey;
alter table public.sleep_schedules drop constraint if exists sleep_schedules_linked_qiyam_path_id_fkey;

alter table public.worship_definitions drop constraint if exists worship_definitions_pillar_owner_fk;
alter table public.worship_definitions add constraint worship_definitions_pillar_owner_fk
  foreign key (pillar_id, user_id) references public.pillars(id, user_id)
  on delete cascade not valid;
alter table public.worship_definitions drop constraint if exists worship_definitions_vision_owner_fk;
alter table public.worship_definitions add constraint worship_definitions_vision_owner_fk
  foreign key (vision_id, user_id) references public.visions(id, user_id)
  on delete set null (vision_id) not valid;
alter table public.worship_definitions drop constraint if exists worship_definitions_goal_owner_fk;
alter table public.worship_definitions add constraint worship_definitions_goal_owner_fk
  foreign key (goal_id, user_id) references public.value_goals(id, user_id)
  on delete set null (goal_id) not valid;

alter table public.quran_khatmas drop constraint if exists quran_khatmas_owner_definition_fk;
alter table public.quran_khatmas add constraint quran_khatmas_owner_definition_fk
  foreign key (user_id, worship_id) references public.worship_definitions(user_id, id)
  on delete cascade not valid;

alter table public.quran_hifz_trackers drop constraint if exists quran_hifz_owner_definition_fk;
alter table public.quran_hifz_trackers add constraint quran_hifz_owner_definition_fk
  foreign key (user_id, worship_id) references public.worship_definitions(user_id, id)
  on delete cascade not valid;
alter table public.quran_hifz_trackers drop constraint if exists quran_hifz_pillar_owner_fk;
alter table public.quran_hifz_trackers add constraint quran_hifz_pillar_owner_fk
  foreign key (pillar_id, user_id) references public.pillars(id, user_id)
  on delete cascade not valid;
alter table public.quran_hifz_trackers drop constraint if exists quran_hifz_vision_owner_fk;
alter table public.quran_hifz_trackers add constraint quran_hifz_vision_owner_fk
  foreign key (vision_id, user_id) references public.visions(id, user_id)
  on delete set null (vision_id) not valid;
alter table public.quran_hifz_trackers drop constraint if exists quran_hifz_goal_owner_fk;
alter table public.quran_hifz_trackers add constraint quran_hifz_goal_owner_fk
  foreign key (goal_id, user_id) references public.value_goals(id, user_id)
  on delete set null (goal_id) not valid;

alter table public.sleep_schedules drop constraint if exists sleep_schedules_pillar_owner_fk;
alter table public.sleep_schedules add constraint sleep_schedules_pillar_owner_fk
  foreign key (pillar_id, user_id) references public.pillars(id, user_id)
  on delete cascade not valid;
alter table public.sleep_schedules drop constraint if exists sleep_schedules_qiyam_path_owner_fk;
alter table public.sleep_schedules add constraint sleep_schedules_qiyam_path_owner_fk
  foreign key (user_id, linked_qiyam_path_id) references public.progression_paths(user_id, id)
  on delete set null (linked_qiyam_path_id) not valid;

-- Google links belong to both a connection and a same-owner calendar event.
-- Keep the auth.users FK as a final cleanup path for legacy links without a connection.
alter table public.google_calendar_event_links drop constraint if exists google_calendar_links_connection_fk;
alter table public.google_calendar_event_links add constraint google_calendar_links_connection_fk
  foreign key (user_id) references public.google_calendar_connections(user_id)
  on delete cascade not valid;
alter table public.google_calendar_event_links drop constraint if exists google_calendar_links_event_owner_fk;
alter table public.google_calendar_event_links add constraint google_calendar_links_event_owner_fk
  foreign key (calendar_event_id, user_id) references public.calendar_events(id, user_id)
  on delete cascade not valid;

-- Server-only, one-use OAuth state and short distributed synchronization leases.
create table if not exists public.google_oauth_states (
  nonce_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists google_oauth_states_expires_idx on public.google_oauth_states(expires_at);
alter table public.google_oauth_states enable row level security;
revoke all on table public.google_oauth_states from anon, authenticated;

create table if not exists public.google_sync_locks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locked_until timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists google_sync_locks_until_idx on public.google_sync_locks(locked_until);
alter table public.google_sync_locks enable row level security;
revoke all on table public.google_sync_locks from anon, authenticated;

-- One row per user is both the snapshot revision and the row-level serialization lock.
create table if not exists public.snapshot_revisions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.snapshot_revisions enable row level security;
revoke all on table public.snapshot_revisions from anon, authenticated;

-- Shared writer used by both RPC signatures. It owns the row lock and is never exposed as RPC.
create or replace function public.dawenli_write_snapshot_locked(
  p_snapshot jsonb,
  p_expected_revision bigint,
  p_require_revision boolean
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  table_name text;
  item jsonb;
  source_key text;
  schema_version integer;
  current_revision bigint;
  caller_id uuid := auth.uid();
  insert_order text[] := array[
    'pillars','visions','value_goals','projects','tasks','system_reviews',
    'inbox_items','habits','vault_items','focus_sessions','time_blocks',
    'journal_entries','calendar_events','custom_field_definitions',
    'worship_definitions','worship_logs','progression_paths','quran_khatmas',
    'quran_hifz_trackers','sleep_schedules'
  ];
  delete_order text[] := array[
    'sleep_schedules','quran_hifz_trackers','quran_khatmas','progression_paths',
    'worship_logs','worship_definitions','calendar_events','journal_entries',
    'time_blocks','focus_sessions','tasks','projects','value_goals','visions',
    'system_reviews','inbox_items','habits','vault_items',
    'custom_field_definitions','pillars'
  ];
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception using errcode = '22P02', message = 'Invalid snapshot';
  end if;
  if p_require_revision and p_expected_revision is null then
    raise exception using errcode = '22004', message = 'Expected snapshot revision is required';
  end if;
  if p_expected_revision is not null and p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Snapshot revision must be non-negative';
  end if;

  schema_version := coalesce(nullif(p_snapshot->>'schemaVersion', '')::integer, 0);
  if schema_version < 5 then
    insert_order := array[
      'pillars','visions','value_goals','projects','tasks','system_reviews',
      'inbox_items','habits','vault_items','focus_sessions','time_blocks',
      'custom_field_definitions','worship_definitions','worship_logs',
      'progression_paths','quran_khatmas','quran_hifz_trackers','sleep_schedules'
    ];
    delete_order := array[
      'sleep_schedules','quran_hifz_trackers','quran_khatmas','progression_paths',
      'worship_logs','worship_definitions','time_blocks','focus_sessions','tasks',
      'projects','value_goals','visions','system_reviews','inbox_items','habits',
      'vault_items','custom_field_definitions','pillars'
    ];
  end if;

  foreach source_key in array insert_order loop
    for item in
      select value from jsonb_array_elements(coalesce(p_snapshot->source_key, '[]'::jsonb))
    loop
      if (item->>'user_id') is null or (item->>'user_id')::uuid is distinct from caller_id then
        raise exception using errcode = '42501', message = 'Snapshot ownership mismatch';
      end if;
    end loop;
  end loop;

  insert into public.snapshot_revisions(user_id)
  values (caller_id)
  on conflict (user_id) do nothing;

  select revision into current_revision
  from public.snapshot_revisions
  where user_id = caller_id
  for update;

  if p_expected_revision is not null and p_expected_revision is distinct from current_revision then
    raise exception using
      errcode = '40001',
      message = 'Snapshot revision conflict',
      detail = format('Expected revision %s, current revision %s', p_expected_revision, current_revision);
  end if;

  foreach table_name in array delete_order loop
    execute format('delete from public.%I where user_id = $1', table_name) using caller_id;
  end loop;
  foreach table_name in array insert_order loop
    execute format(
      'insert into public.%I select (jsonb_populate_recordset(null::public.%I, $1)).*',
      table_name,
      table_name
    ) using coalesce(p_snapshot->table_name, '[]'::jsonb);
  end loop;

  update public.snapshot_revisions
  set revision = revision + 1,
      updated_at = now()
  where user_id = caller_id
  returning revision into current_revision;

  return current_revision;
end;
$$;

-- Strict CAS RPC for future clients.
create or replace function public.dawenli_save_snapshot(
  p_snapshot jsonb,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.dawenli_write_snapshot_locked(p_snapshot, p_expected_revision, true);
end;
$$;

-- Preserve the function signature for deployed clients, but do not grant the blind-write contract.
-- Current clients use the CAS overload below; old clients must fail closed rather than overwrite newer data.
create or replace function public.dawenli_save_snapshot(p_snapshot jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.dawenli_write_snapshot_locked(p_snapshot, null::bigint, false);
end;
$$;

create or replace function public.dawenli_get_snapshot_revision()
returns bigint
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  current_revision bigint;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  select revision into current_revision
  from public.snapshot_revisions
  where user_id = caller_id;
  return coalesce(current_revision, 0);
end;
$$;

-- Clear participates in the same lock/revision protocol, preserving its existing signature.
create or replace function public.dawenli_clear_snapshot()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  table_name text;
  caller_id uuid := auth.uid();
  current_revision bigint;
  delete_order text[] := array[
    'sleep_schedules','quran_hifz_trackers','quran_khatmas','progression_paths',
    'worship_logs','worship_definitions','calendar_events','journal_entries',
    'time_blocks','focus_sessions','tasks','projects','value_goals','visions',
    'system_reviews','inbox_items','habits','vault_items',
    'custom_field_definitions','pillars'
  ];
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  insert into public.snapshot_revisions(user_id)
  values (caller_id)
  on conflict (user_id) do nothing;
  select revision into current_revision
  from public.snapshot_revisions
  where user_id = caller_id
  for update;

  foreach table_name in array delete_order loop
    execute format('delete from public.%I where user_id = $1', table_name) using caller_id;
  end loop;

  update public.snapshot_revisions
  set revision = revision + 1,
      updated_at = now()
  where user_id = caller_id;
end;
$$;

revoke all on function public.dawenli_write_snapshot_locked(jsonb, bigint, boolean) from public, anon, authenticated;
revoke all on function public.dawenli_save_snapshot(jsonb, bigint) from public, anon, authenticated;
revoke all on function public.dawenli_save_snapshot(jsonb) from public, anon, authenticated;
revoke all on function public.dawenli_get_snapshot_revision() from public, anon, authenticated;
revoke all on function public.dawenli_clear_snapshot() from public, anon, authenticated;
grant execute on function public.dawenli_save_snapshot(jsonb, bigint) to authenticated;
-- The legacy one-argument function intentionally remains revoked.
grant execute on function public.dawenli_get_snapshot_revision() to authenticated;
grant execute on function public.dawenli_clear_snapshot() to authenticated;

-- Service-only helpers for server-side Google synchronization and external writes.
create or replace function public.dawenli_try_acquire_google_sync_lock(p_user_id uuid, p_lease_seconds integer default 60)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare acquired boolean;
begin
  if p_user_id is null or p_lease_seconds < 1 or p_lease_seconds > 300 then return false; end if;
  insert into public.google_sync_locks(user_id, locked_until)
  values (p_user_id, now() + make_interval(secs => p_lease_seconds))
  on conflict (user_id) do update
    set locked_until = excluded.locked_until
    where public.google_sync_locks.locked_until <= now()
  returning true into acquired;
  return coalesce(acquired, false);
end;
$$;

create or replace function public.dawenli_release_google_sync_lock(p_user_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.google_sync_locks where user_id = p_user_id;
$$;

create or replace function public.dawenli_bump_snapshot_revision(p_user_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare next_revision bigint;
begin
  if p_user_id is null then raise exception using errcode = '22004', message = 'User id is required'; end if;
  insert into public.snapshot_revisions(user_id) values (p_user_id) on conflict (user_id) do nothing;
  update public.snapshot_revisions set revision = revision + 1, updated_at = now()
    where user_id = p_user_id returning revision into next_revision;
  return next_revision;
end;
$$;

revoke all on function public.dawenli_try_acquire_google_sync_lock(uuid, integer) from public, anon, authenticated;
revoke all on function public.dawenli_release_google_sync_lock(uuid) from public, anon, authenticated;
revoke all on function public.dawenli_bump_snapshot_revision(uuid) from public, anon, authenticated;
grant execute on function public.dawenli_try_acquire_google_sync_lock(uuid, integer) to service_role;
grant execute on function public.dawenli_release_google_sync_lock(uuid) to service_role;
grant execute on function public.dawenli_bump_snapshot_revision(uuid) to service_role;

-- Distributed per-user AI quota shared by all serverless instances.
create table if not exists public.ai_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.ai_rate_limits enable row level security;
revoke all on table public.ai_rate_limits from anon, authenticated;

create or replace function public.dawenli_consume_ai_quota(p_user_id uuid, p_limit integer default 20)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare current_count integer;
begin
  if p_user_id is null or p_limit < 1 or p_limit > 100 then return false; end if;
  insert into public.ai_rate_limits(user_id, window_started_at, request_count)
  values (p_user_id, now(), 1)
  on conflict (user_id) do update set
    window_started_at = case when public.ai_rate_limits.window_started_at <= now() - interval '1 minute' then now() else public.ai_rate_limits.window_started_at end,
    request_count = case when public.ai_rate_limits.window_started_at <= now() - interval '1 minute' then 1 else public.ai_rate_limits.request_count + 1 end,
    updated_at = now()
  returning request_count into current_count;
  return current_count <= p_limit;
end;
$$;

revoke all on function public.dawenli_consume_ai_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.dawenli_consume_ai_quota(uuid, integer) to service_role;
