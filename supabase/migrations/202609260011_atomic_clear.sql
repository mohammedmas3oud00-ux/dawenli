-- Atomic account reset used by the explicit user reset action.
create or replace function public.dawenli_clear_snapshot()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare table_name text;
  delete_order text[] := array['sleep_schedules','quran_hifz_trackers','quran_khatmas','progression_paths','worship_logs','worship_definitions','time_blocks','focus_sessions','tasks','projects','value_goals','visions','system_reviews','inbox_items','habits','vault_items','custom_field_definitions','pillars'];
begin
  if auth.uid() is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  foreach table_name in array delete_order loop
    execute format('delete from public.%I where user_id = $1', table_name) using auth.uid();
  end loop;
end;
$$;
revoke all on function public.dawenli_clear_snapshot() from public, anon;
grant execute on function public.dawenli_clear_snapshot() to authenticated;
