-- Keep plpgsql_check useful by using row iteration it can resolve statically.
create or replace function public.dawenli_recalculate_goal(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  value numeric;
  parent_vision uuid;
  parent_pillar uuid;
begin
  select coalesce(round(avg(progress), 2), 0)
  into value
  from public.projects
  where goal_id = target_id;

  update public.value_goals
  set progress = value,
      status = case
        when value = 100 then 'completed'
        when value > 0 then 'in_progress'
        when status = 'completed' then 'not_started'
        else status
      end,
      updated_at = now()
  where id = target_id
  returning vision_id, pillar_id into parent_vision, parent_pillar;

  if parent_vision is not null then
    perform public.dawenli_recalculate_vision(parent_vision);
  else
    perform public.dawenli_recalculate_pillar(parent_pillar);
  end if;
end;
$$;

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
  target_table text;
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
  set local lock_timeout = '5s';
  set local statement_timeout = '30s';

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

  for source_key in select unnest(insert_order)
  loop
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

  for target_table in select unnest(delete_order)
  loop
    execute format('delete from public.%I where user_id = $1', target_table) using caller_id;
  end loop;
  for target_table in select unnest(insert_order)
  loop
    execute format(
      'insert into public.%I select (jsonb_populate_recordset(null::public.%I, $1)).*',
      target_table,
      target_table
    ) using coalesce(p_snapshot->target_table, '[]'::jsonb);
  end loop;

  update public.snapshot_revisions
  set revision = revision + 1,
      updated_at = now()
  where user_id = caller_id
  returning revision into current_revision;

  return current_revision;
end;
$$;

create or replace function public.dawenli_clear_snapshot()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_table text;
  caller_id uuid := auth.uid();
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
  perform revision
  from public.snapshot_revisions
  where user_id = caller_id
  for update;

  for target_table in select unnest(delete_order)
  loop
    execute format('delete from public.%I where user_id = $1', target_table) using caller_id;
  end loop;

  update public.snapshot_revisions
  set revision = revision + 1,
      updated_at = now()
  where user_id = caller_id;
end;
$$;
