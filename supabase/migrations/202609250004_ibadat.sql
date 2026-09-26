-- عبادات وأوراد: all records are isolated by user_id and can be saved by the snapshot RPC.
create table if not exists public.worship_definitions (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  pillar_id uuid not null, vision_id uuid, goal_id uuid, title text not null,
  category text not null check (category in ('salah','sunnah_rawatib','adhkar','quran_wird','qiyam','fasting','sadaqah','custom_dua','quran_hifz')),
  tracking_type text not null check (tracking_type in ('checkbox','counter','multi_option','amount','pages')),
  frequency text not null default 'daily', scheduled_days jsonb, time_of_day text,
  target_count numeric, target_pages numeric, is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz
);
create table if not exists public.worship_logs (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  worship_id uuid not null references public.worship_definitions(id) on delete cascade,
  date date not null, is_completed boolean not null default false, count numeric, amount numeric,
  pages_read numeric, performance text check (performance in ('ada','qada','missed')),
  congregation text check (congregation in ('jamaah','fard')), sunnah_completed boolean,
  rakaat_count numeric, performed_at_time time, fasting_type text,
  notes text, completed_at timestamptz, created_at timestamptz not null default now(), unique(user_id, worship_id, date)
);
create table if not exists public.progression_paths (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  worship_id uuid not null references public.worship_definitions(id) on delete cascade,
  title text not null, stages jsonb not null default '[]'::jsonb, current_stage_index integer not null default 0,
  stage_start_date date not null, consecutive_days integer not null default 0, auto_promote boolean not null default false,
  last_promotion_date date, created_at timestamptz not null default now(), updated_at timestamptz
);
create table if not exists public.quran_khatmas (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  worship_id uuid not null references public.worship_definitions(id) on delete cascade,
  khatma_number integer not null, start_date date not null, end_date date, target_days integer,
  current_page integer not null check(current_page between 1 and 604), current_juz integer not null check(current_juz between 1 and 30),
  daily_target_pages integer not null check(daily_target_pages > 0), is_completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz, unique(user_id, khatma_number)
);
create table if not exists public.quran_hifz_trackers (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  worship_id uuid not null references public.worship_definitions(id) on delete cascade,
  pillar_id uuid not null, vision_id uuid, goal_id uuid, surahs jsonb not null default '[]'::jsonb,
  total_memorized_pages numeric not null default 0, daily_review_pages numeric not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz
);
create table if not exists public.sleep_schedules (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  pillar_id uuid not null, ultimate_bedtime time not null, ultimate_waketime time not null,
  current_bedtime time not null, current_waketime time not null, adjustment_minutes integer not null default 15,
  adjustment_frequency_days integer not null default 7, linked_qiyam_path_id uuid references public.progression_paths(id) on delete set null,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz
);

-- Composite ownership checks prevent cross-account references even when IDs are guessed.
create unique index if not exists worship_definitions_owner_id on public.worship_definitions(user_id, id);
create unique index if not exists progression_paths_owner_id on public.progression_paths(user_id, id);
alter table public.worship_logs drop constraint if exists worship_logs_owner_definition_fkey;
alter table public.worship_logs add constraint worship_logs_owner_definition_fkey foreign key (user_id, worship_id) references public.worship_definitions(user_id, id) on delete cascade;
alter table public.progression_paths drop constraint if exists progression_paths_owner_definition_fkey;
alter table public.progression_paths add constraint progression_paths_owner_definition_fkey foreign key (user_id, worship_id) references public.worship_definitions(user_id, id) on delete cascade;

alter table public.worship_definitions enable row level security;
alter table public.worship_logs enable row level security;
alter table public.progression_paths enable row level security;
alter table public.quran_khatmas enable row level security;
alter table public.quran_hifz_trackers enable row level security;
alter table public.sleep_schedules enable row level security;
do $$ declare t text; begin foreach t in array array['worship_definitions','worship_logs','progression_paths','quran_khatmas','quran_hifz_trackers','sleep_schedules'] loop
  execute format('revoke all on table public.%I from anon', t);
  execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
end loop; end $$;
do $$ declare t text; begin foreach t in array array['worship_definitions','worship_logs','progression_paths','quran_khatmas','quran_hifz_trackers','sleep_schedules'] loop
  execute format('drop policy if exists %I on public.%I', t || '_owner', t);
  execute format('create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_owner', t);
end loop; end $$;

-- Extend the existing atomic snapshot function in a follow-up migration so old deployments remain compatible.
-- This function intentionally replaces only the authenticated caller's rows in one transaction.
create or replace function public.dawenli_save_snapshot(p_snapshot jsonb) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare table_name text; item jsonb; source_key text;
  insert_order text[] := array['pillars','visions','value_goals','projects','tasks','system_reviews','inbox_items','habits','vault_items','focus_sessions','time_blocks','custom_field_definitions','worship_definitions','worship_logs','progression_paths','quran_khatmas','quran_hifz_trackers','sleep_schedules'];
  delete_order text[] := array['sleep_schedules','quran_hifz_trackers','quran_khatmas','progression_paths','worship_logs','worship_definitions','time_blocks','focus_sessions','tasks','projects','value_goals','visions','system_reviews','inbox_items','habits','vault_items','custom_field_definitions','pillars'];
begin
  if auth.uid() is null then raise exception using errcode='42501', message='Authentication required'; end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then raise exception using errcode='22P02', message='Invalid snapshot'; end if;
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
