-- Non-destructive, repeatable hardening migration for Dawenli schema v3.
create extension if not exists pgcrypto;

alter table public.projects add column if not exists custom_fields jsonb not null default '{}'::jsonb;
alter table public.tasks add column if not exists estimated_hours numeric(7,2);
alter table public.tasks add column if not exists energy_level text;
alter table public.tasks add column if not exists custom_fields jsonb not null default '{}'::jsonb;
alter table public.tasks drop constraint if exists tasks_energy_level_check;
alter table public.tasks add constraint tasks_energy_level_check check (energy_level is null or energy_level in ('low','medium','high')) not valid;
alter table public.inbox_items drop constraint if exists inbox_items_converted_to_check;
alter table public.inbox_items add constraint inbox_items_converted_to_check check (converted_to in ('task','project','goal','habit','vault')) not valid;
alter table public.habits add column if not exists longest_streak integer not null default 0;
alter table public.habits add column if not exists custom_days integer[] not null default '{}';
update public.habits set longest_streak = greatest(longest_streak, coalesce(best_streak, 0)) where longest_streak = 0;
alter table public.vault_items add column if not exists status text not null default 'active';
alter table public.vault_items drop constraint if exists vault_items_status_check;
alter table public.vault_items add constraint vault_items_status_check check (status in ('active','reading','completed','someday','archived','reference')) not valid;
alter table public.system_reviews add column if not exists focus_goal_ids uuid[] not null default '{}';
alter table public.system_reviews add column if not exists focus_project_ids uuid[] not null default '{}';

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid,
  task_title text,
  project_title text,
  pillar_title text,
  mode text not null check (mode in ('pomodoro','flowtime')),
  duration_seconds integer not null check (duration_seconds >= 0),
  date date not null,
  completed_at timestamptz not null default now(),
  notes text,
  break_seconds integer,
  distractions_count integer
);

create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  title text not null,
  task_id uuid,
  project_id uuid,
  pillar_id uuid,
  category text not null,
  color text,
  is_completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  constraint time_blocks_valid_range check (end_time > start_time)
);

create table if not exists public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('text','number','select','date','checkbox')),
  options text[],
  entity_type text not null check (entity_type in ('task','project')),
  created_at timestamptz not null default now()
);

create index if not exists focus_sessions_user_date_idx on public.focus_sessions(user_id, date);
create index if not exists time_blocks_user_date_idx on public.time_blocks(user_id, date);
create index if not exists custom_fields_user_idx on public.custom_field_definitions(user_id);

-- Composite uniqueness enables ownership-preserving foreign keys.
do $$
declare table_name text;
begin
  foreach table_name in array array['pillars','visions','value_goals','projects','tasks','system_reviews','inbox_items','habits','vault_items','focus_sessions','time_blocks','custom_field_definitions']
  loop
    if not exists (
      select 1 from pg_constraint where conname = table_name || '_id_user_unique'
    ) then
      execute format('alter table public.%I add constraint %I unique (id, user_id)', table_name, table_name || '_id_user_unique');
    end if;
  end loop;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='visions_pillar_owner_fk') then
    alter table public.visions add constraint visions_pillar_owner_fk foreign key (pillar_id,user_id) references public.pillars(id,user_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='goals_pillar_owner_fk') then
    alter table public.value_goals add constraint goals_pillar_owner_fk foreign key (pillar_id,user_id) references public.pillars(id,user_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='goals_vision_owner_fk') then
    alter table public.value_goals add constraint goals_vision_owner_fk foreign key (vision_id,user_id) references public.visions(id,user_id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='projects_goal_owner_fk') then
    alter table public.projects add constraint projects_goal_owner_fk foreign key (goal_id,user_id) references public.value_goals(id,user_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='tasks_project_owner_fk') then
    alter table public.tasks add constraint tasks_project_owner_fk foreign key (project_id,user_id) references public.projects(id,user_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='habits_pillar_owner_fk') then
    alter table public.habits add constraint habits_pillar_owner_fk foreign key (pillar_id,user_id) references public.pillars(id,user_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='vaults_pillar_owner_fk') then
    alter table public.vault_items add constraint vaults_pillar_owner_fk foreign key (pillar_id,user_id) references public.pillars(id,user_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='vaults_project_owner_fk') then
    alter table public.vault_items add constraint vaults_project_owner_fk foreign key (project_id,user_id) references public.projects(id,user_id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='reviews_pillar_owner_fk') then
    alter table public.system_reviews add constraint reviews_pillar_owner_fk foreign key (focus_pillar_id,user_id) references public.pillars(id,user_id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='focus_task_owner_fk') then
    alter table public.focus_sessions add constraint focus_task_owner_fk foreign key (task_id,user_id) references public.tasks(id,user_id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='blocks_task_owner_fk') then
    alter table public.time_blocks add constraint blocks_task_owner_fk foreign key (task_id,user_id) references public.tasks(id,user_id) on delete set null not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='blocks_project_owner_fk') then
    alter table public.time_blocks add constraint blocks_project_owner_fk foreign key (project_id,user_id) references public.projects(id,user_id) on delete cascade not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='blocks_pillar_owner_fk') then
    alter table public.time_blocks add constraint blocks_pillar_owner_fk foreign key (pillar_id,user_id) references public.pillars(id,user_id) on delete cascade not valid;
  end if;
end $$;

-- Least privilege + one explicit policy per operation.
do $$
declare table_name text; policy_name text;
begin
  foreach table_name in array array['pillars','visions','value_goals','projects','tasks','system_reviews','inbox_items','habits','vault_items','focus_sessions','time_blocks','custom_field_definitions']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    execute format('grant select,insert,update,delete on public.%I to authenticated', table_name);
    for policy_name in select policyname from pg_policies where schemaname='public' and tablename=table_name loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', 'dawenli_' || table_name || '_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', 'dawenli_' || table_name || '_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', 'dawenli_' || table_name || '_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', 'dawenli_' || table_name || '_delete', table_name);
  end loop;
end $$;

create or replace function public.dawenli_recalculate_pillar(target_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.pillars p set progress = coalesce((
    select round(avg(child.progress),2) from (
      select v.progress from public.visions v where v.pillar_id=target_id
      union all
      select g.progress from public.value_goals g where g.pillar_id=target_id and g.vision_id is null
    ) child
  ),0), updated_at=now() where p.id=target_id;
end $$;

create or replace function public.dawenli_recalculate_vision(target_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare parent_id uuid;
begin
  update public.visions v set progress=coalesce((select round(avg(g.progress),2) from public.value_goals g where g.vision_id=target_id),0), updated_at=now()
  where v.id=target_id returning pillar_id into parent_id;
  if parent_id is not null then perform public.dawenli_recalculate_pillar(parent_id); end if;
end $$;

create or replace function public.dawenli_recalculate_goal(target_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare value numeric; old_status text; parent_vision uuid; parent_pillar uuid;
begin
  select coalesce(round(avg(progress),2),0) into value from public.projects where goal_id=target_id;
  update public.value_goals set progress=value,
    status=case when value=100 then 'completed' when value>0 then 'in_progress' when status='completed' then 'not_started' else status end,
    updated_at=now() where id=target_id returning vision_id,pillar_id into parent_vision,parent_pillar;
  if parent_vision is not null then perform public.dawenli_recalculate_vision(parent_vision); else perform public.dawenli_recalculate_pillar(parent_pillar); end if;
end $$;

create or replace function public.dawenli_recalculate_project(target_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare value numeric; parent_id uuid;
begin
  select coalesce(round(avg(case when status='done' then 100 else 0 end),2),0) into value from public.tasks where project_id=target_id;
  update public.projects set progress=value,
    status=case when value=100 then 'completed' when status='completed' and value>0 then 'in_progress' when status='completed' then 'planned' else status end,
    updated_at=now() where id=target_id returning goal_id into parent_id;
  if parent_id is not null then perform public.dawenli_recalculate_goal(parent_id); end if;
end $$;

create or replace function public.dawenli_task_completed_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.status='done' and (tg_op='INSERT' or old.status is distinct from 'done') then new.completed_at=coalesce(new.completed_at,now()); end if;
  if new.status<>'done' then new.completed_at=null; end if;
  return new;
end $$;

create or replace function public.dawenli_task_rollup()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op<>'INSERT' then perform public.dawenli_recalculate_project(old.project_id); end if;
  if tg_op<>'DELETE' and (tg_op='INSERT' or new.project_id is distinct from old.project_id) then perform public.dawenli_recalculate_project(new.project_id); end if;
  if tg_op='UPDATE' and new.project_id=old.project_id then perform public.dawenli_recalculate_project(new.project_id); end if;
  return coalesce(new,old);
end $$;

create or replace function public.dawenli_project_rollup()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op<>'INSERT' then perform public.dawenli_recalculate_goal(old.goal_id); end if;
  if tg_op<>'DELETE' and (tg_op='INSERT' or new.goal_id is distinct from old.goal_id) then perform public.dawenli_recalculate_goal(new.goal_id); end if;
  return coalesce(new,old);
end $$;

create or replace function public.dawenli_goal_rollup()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op<>'INSERT' then
    if old.vision_id is not null then perform public.dawenli_recalculate_vision(old.vision_id); else perform public.dawenli_recalculate_pillar(old.pillar_id); end if;
  end if;
  if tg_op<>'DELETE' then
    if new.vision_id is not null then perform public.dawenli_recalculate_vision(new.vision_id); else perform public.dawenli_recalculate_pillar(new.pillar_id); end if;
  end if;
  return coalesce(new,old);
end $$;

create or replace function public.dawenli_vision_rollup()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op<>'INSERT' then perform public.dawenli_recalculate_pillar(old.pillar_id); end if;
  if tg_op<>'DELETE' then perform public.dawenli_recalculate_pillar(new.pillar_id); end if;
  return coalesce(new,old);
end $$;

drop trigger if exists trigger_task_cascade_rollup on public.tasks;
drop trigger if exists dawenli_task_completed_at on public.tasks;
create trigger dawenli_task_completed_at before insert or update of status on public.tasks for each row execute function public.dawenli_task_completed_at();
drop trigger if exists dawenli_task_rollup on public.tasks;
create trigger dawenli_task_rollup after insert or update or delete on public.tasks for each row execute function public.dawenli_task_rollup();
drop trigger if exists dawenli_project_rollup on public.projects;
create trigger dawenli_project_rollup after insert or update of goal_id or delete on public.projects for each row execute function public.dawenli_project_rollup();
drop trigger if exists dawenli_goal_rollup on public.value_goals;
create trigger dawenli_goal_rollup after insert or update of vision_id,pillar_id or delete on public.value_goals for each row execute function public.dawenli_goal_rollup();
drop trigger if exists dawenli_vision_rollup on public.visions;
create trigger dawenli_vision_rollup after insert or update of pillar_id or delete on public.visions for each row execute function public.dawenli_vision_rollup();

-- Prevent overlapping blocks atomically for each user/day.
create or replace function public.dawenli_prevent_time_overlap()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if exists(select 1 from public.time_blocks b where b.user_id=new.user_id and b.date=new.date and b.id<>new.id and new.start_time<b.end_time and new.end_time>b.start_time) then
    raise exception 'time block overlaps an existing block' using errcode='23P01';
  end if;
  return new;
end $$;
drop trigger if exists dawenli_time_overlap on public.time_blocks;
create trigger dawenli_time_overlap before insert or update on public.time_blocks for each row execute function public.dawenli_prevent_time_overlap();
