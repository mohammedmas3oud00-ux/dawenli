-- Older installations have mandatory updated_at columns without defaults.
-- Backfill safely, then make future direct writes behave like repository writes.
do $$
declare table_name text;
begin
  foreach table_name in array array['pillars','visions','value_goals','projects','tasks','system_reviews','inbox_items','habits','vault_items','focus_sessions','time_blocks'] loop
    if exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=table_name and c.column_name='updated_at') then
      execute format('update public.%I set updated_at = coalesce(updated_at, now()) where updated_at is null', table_name);
      execute format('alter table public.%I alter column updated_at set default now()', table_name);
    end if;
  end loop;
end $$;
