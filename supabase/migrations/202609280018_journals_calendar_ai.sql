-- Journals, recurring calendar events, optional private journal audio, and calendar reminders.
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  entry_date date not null default current_date,
  mood text check (mood is null or mood in ('great','good','neutral','difficult')),
  tags text[] not null default '{}',
  pillar_id uuid,
  project_id uuid,
  audio_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint journal_pillar_owner_fk foreign key (pillar_id,user_id) references public.pillars(id,user_id) on delete set null,
  constraint journal_project_owner_fk foreign key (project_id,user_id) references public.projects(id,user_id) on delete set null
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  timezone text not null default 'Africa/Cairo',
  recurrence jsonb not null default '{"frequency":"none","interval":1}'::jsonb,
  reminder_minutes integer check (reminder_minutes is null or reminder_minutes between 0 and 10080),
  task_id uuid,
  project_id uuid,
  pillar_id uuid,
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint calendar_event_range check (end_at is null or end_at > start_at),
  constraint calendar_task_owner_fk foreign key (task_id,user_id) references public.tasks(id,user_id) on delete set null,
  constraint calendar_project_owner_fk foreign key (project_id,user_id) references public.projects(id,user_id) on delete set null,
  constraint calendar_pillar_owner_fk foreign key (pillar_id,user_id) references public.pillars(id,user_id) on delete set null
);

create index if not exists journal_entries_user_date_idx on public.journal_entries(user_id, entry_date desc);
create index if not exists calendar_events_user_start_idx on public.calendar_events(user_id, start_at);

alter table public.journal_entries enable row level security;
alter table public.calendar_events enable row level security;
revoke all on table public.journal_entries, public.calendar_events from anon;
grant select, insert, update, delete on table public.journal_entries, public.calendar_events to authenticated;
drop policy if exists journal_entries_owner on public.journal_entries;
create policy journal_entries_owner on public.journal_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists calendar_events_owner on public.calendar_events;
create policy calendar_events_owner on public.calendar_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal-audio', 'journal-audio', false, 5242880, array['audio/webm','audio/mp4','audio/mpeg','audio/ogg'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists journal_audio_owner_select on storage.objects;
create policy journal_audio_owner_select on storage.objects for select to authenticated
using (bucket_id='journal-audio' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists journal_audio_owner_insert on storage.objects;
create policy journal_audio_owner_insert on storage.objects for insert to authenticated
with check (bucket_id='journal-audio' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists journal_audio_owner_update on storage.objects;
create policy journal_audio_owner_update on storage.objects for update to authenticated
using (bucket_id='journal-audio' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id='journal-audio' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists journal_audio_owner_delete on storage.objects;
create policy journal_audio_owner_delete on storage.objects for delete to authenticated
using (bucket_id='journal-audio' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.push_subscriptions add column if not exists calendar_enabled boolean not null default true;

create or replace function public.dawenli_save_snapshot(p_snapshot jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare table_name text; item jsonb; source_key text; schema_version integer;
  insert_order text[] := array['pillars','visions','value_goals','projects','tasks','system_reviews','inbox_items','habits','vault_items','focus_sessions','time_blocks','custom_field_definitions','worship_definitions','worship_logs','progression_paths','quran_khatmas','quran_hifz_trackers','sleep_schedules'];
  delete_order text[] := array['sleep_schedules','quran_hifz_trackers','quran_khatmas','progression_paths','worship_logs','worship_definitions','time_blocks','focus_sessions','tasks','projects','value_goals','visions','system_reviews','inbox_items','habits','vault_items','custom_field_definitions','pillars'];
begin
  if auth.uid() is null then raise exception using errcode='42501', message='Authentication required'; end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then raise exception using errcode='22P02', message='Invalid snapshot'; end if;
  schema_version := coalesce(nullif(p_snapshot->>'schemaVersion','')::integer, 0);
  if schema_version >= 5 then
    insert_order := array_cat(insert_order, array['journal_entries','calendar_events']);
    delete_order := array_cat(array['calendar_events','journal_entries'], delete_order);
  end if;
  foreach source_key in array insert_order loop
    for item in select value from jsonb_array_elements(coalesce(p_snapshot->source_key, '[]'::jsonb)) loop
      if (item->>'user_id') is null or (item->>'user_id')::uuid is distinct from auth.uid() then raise exception using errcode='42501', message='Snapshot ownership mismatch'; end if;
    end loop;
  end loop;
  foreach table_name in array delete_order loop execute format('delete from public.%I where user_id = $1', table_name) using auth.uid(); end loop;
  foreach table_name in array insert_order loop execute format('insert into public.%I select (jsonb_populate_recordset(null::public.%I, $1)).*', table_name, table_name) using coalesce(p_snapshot->table_name, '[]'::jsonb); end loop;
end; $$;
revoke all on function public.dawenli_save_snapshot(jsonb) from public, anon;
grant execute on function public.dawenli_save_snapshot(jsonb) to authenticated;

create or replace function public.dawenli_clear_snapshot() returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare table_name text;
  delete_order text[] := array['sleep_schedules','quran_hifz_trackers','quran_khatmas','progression_paths','worship_logs','worship_definitions','calendar_events','journal_entries','time_blocks','focus_sessions','tasks','projects','value_goals','visions','system_reviews','inbox_items','habits','vault_items','custom_field_definitions','pillars'];
begin
  if auth.uid() is null then raise exception using errcode='42501', message='Authentication required'; end if;
  foreach table_name in array delete_order loop execute format('delete from public.%I where user_id = $1', table_name) using auth.uid(); end loop;
end; $$;
revoke all on function public.dawenli_clear_snapshot() from public, anon;
grant execute on function public.dawenli_clear_snapshot() to authenticated;
