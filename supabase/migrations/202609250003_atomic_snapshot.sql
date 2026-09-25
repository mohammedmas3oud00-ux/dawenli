-- Atomic, ownership-checked snapshot writes. Re-running this migration is safe.
create or replace function public.dawenli_save_snapshot(p_snapshot jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  table_name text;
  item jsonb;
  source_key text;
  insert_order text[] := array[
    'pillars','visions','value_goals','projects','tasks','system_reviews',
    'inbox_items','habits','vault_items','focus_sessions','time_blocks',
    'custom_field_definitions'
  ];
  delete_order text[] := array[
    'time_blocks','focus_sessions','tasks','projects','value_goals','visions',
    'system_reviews','inbox_items','habits','vault_items','custom_field_definitions','pillars'
  ];
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception using errcode = '22P02', message = 'Invalid snapshot';
  end if;

  -- A client can never use this function to write another user's rows.
  foreach source_key in array array[
    'pillars','visions','value_goals','projects','tasks','system_reviews',
    'inbox_items','habits','vault_items','focus_sessions','time_blocks',
    'custom_field_definitions'
  ] loop
    for item in select value from jsonb_array_elements(coalesce(p_snapshot->source_key, '[]'::jsonb)) loop
      if (item->>'user_id') is null or (item->>'user_id')::uuid is distinct from auth.uid() then
        raise exception using errcode = '42501', message = 'Snapshot ownership mismatch';
      end if;
    end loop;
  end loop;

  foreach table_name in array delete_order loop
    execute format('delete from public.%I where user_id = $1', table_name) using auth.uid();
  end loop;

  foreach table_name in array insert_order loop
    execute format(
      'insert into public.%I select (jsonb_populate_recordset(null::public.%I, $1)).*',
      table_name, table_name
    ) using coalesce(p_snapshot->table_name, '[]'::jsonb);
  end loop;
end;
$$;

revoke all on function public.dawenli_save_snapshot(jsonb) from public, anon;
grant execute on function public.dawenli_save_snapshot(jsonb) to authenticated;
