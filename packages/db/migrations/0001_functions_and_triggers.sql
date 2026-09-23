-- Custom SQL migration file, put your code below! --

-- ---------------------------------------------------------------------------
-- 1. updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;
--> statement-breakpoint

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','visions','areas','goals','projects','tasks',
    'habit_categories','habits','habit_logs','templates','reviews'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 2. Auto-create a profile for every new auth user.
--    Locale / display name are taken from signup metadata when present.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ->> 'locale' in ('ar','en')
         then new.raw_user_meta_data ->> 'locale' else 'ar' end
  )
  on conflict (id) do nothing;
  return new;
end
$$;
--> statement-breakpoint

drop trigger if exists on_auth_user_created on auth.users;
--> statement-breakpoint
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- 3. Progress rollup: tasks -> project -> goal -> vision (docs/architecture.md §11)
--    Mirrors @bawsala/core/engines/progress.ts. Cancelled tasks are excluded,
--    task weight = estimate_minutes (or 1), goals honour manual_progress.
-- ---------------------------------------------------------------------------
create or replace function public.recompute_project_progress(p_project_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.progress_cache (entity_type, entity_id, user_id, progress, total_tasks, done_tasks, computed_at)
  select 'project',
         p.id,
         p.user_id,
         coalesce(
           100.0 * sum(case when t.status = 'done' then coalesce(nullif(t.estimate_minutes, 0), 1) else 0 end)
             / nullif(sum(coalesce(nullif(t.estimate_minutes, 0), 1)), 0),
           0),
         count(t.id),
         count(t.id) filter (where t.status = 'done'),
         now()
  from public.projects p
  left join public.tasks t
    on t.project_id = p.id and t.deleted_at is null and t.status <> 'cancelled'
  where p.id = p_project_id
  group by p.id, p.user_id
  on conflict (entity_type, entity_id) do update
    set progress = excluded.progress,
        total_tasks = excluded.total_tasks,
        done_tasks = excluded.done_tasks,
        computed_at = now();
$$;
--> statement-breakpoint

create or replace function public.recompute_goal_progress(p_goal_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.progress_cache (entity_type, entity_id, user_id, progress, total_tasks, done_tasks, computed_at)
  select 'goal',
         g.id,
         g.user_id,
         coalesce(
           g.manual_progress,
           sum(coalesce(nullif(p.weight, 0), 1) * pc.progress) / nullif(sum(coalesce(nullif(p.weight, 0), 1)), 0),
           0),
         coalesce(sum(pc.total_tasks), 0),
         coalesce(sum(pc.done_tasks), 0),
         now()
  from public.goals g
  left join public.projects p on p.goal_id = g.id and p.deleted_at is null
  left join public.progress_cache pc on pc.entity_type = 'project' and pc.entity_id = p.id
  where g.id = p_goal_id
  group by g.id, g.user_id, g.manual_progress
  on conflict (entity_type, entity_id) do update
    set progress = excluded.progress,
        total_tasks = excluded.total_tasks,
        done_tasks = excluded.done_tasks,
        computed_at = now();
$$;
--> statement-breakpoint

create or replace function public.recompute_vision_progress(p_vision_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.progress_cache (entity_type, entity_id, user_id, progress, total_tasks, done_tasks, computed_at)
  select 'vision',
         v.id,
         v.user_id,
         coalesce(avg(pc.progress), 0),
         coalesce(sum(pc.total_tasks), 0),
         coalesce(sum(pc.done_tasks), 0),
         now()
  from public.visions v
  left join public.goals g on g.vision_id = v.id and g.deleted_at is null and g.status = 'active'
  left join public.progress_cache pc on pc.entity_type = 'goal' and pc.entity_id = g.id
  where v.id = p_vision_id
  group by v.id, v.user_id
  on conflict (entity_type, entity_id) do update
    set progress = excluded.progress,
        total_tasks = excluded.total_tasks,
        done_tasks = excluded.done_tasks,
        computed_at = now();
$$;
--> statement-breakpoint

-- Rolls a single project all the way up.
create or replace function public.rollup_from_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_goal_id uuid;
  v_vision_id uuid;
begin
  if p_project_id is null then return; end if;
  perform public.recompute_project_progress(p_project_id);
  select goal_id into v_goal_id from public.projects where id = p_project_id;
  if v_goal_id is not null then
    perform public.recompute_goal_progress(v_goal_id);
    select vision_id into v_vision_id from public.goals where id = v_goal_id;
    if v_vision_id is not null then
      perform public.recompute_vision_progress(v_vision_id);
    end if;
  end if;
end
$$;
--> statement-breakpoint

create or replace function public.tasks_progress_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.project_id is not null then
    perform public.rollup_from_project(old.project_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.project_id is not null
     and (tg_op = 'INSERT' or new.project_id is distinct from old.project_id
          or new.status is distinct from old.status
          or new.estimate_minutes is distinct from old.estimate_minutes
          or new.deleted_at is distinct from old.deleted_at) then
    perform public.rollup_from_project(new.project_id);
  end if;
  return null;
end
$$;
--> statement-breakpoint

drop trigger if exists tasks_progress on public.tasks;
--> statement-breakpoint
create trigger tasks_progress
  after insert or update or delete on public.tasks
  for each row execute function public.tasks_progress_trigger();
--> statement-breakpoint

create or replace function public.projects_progress_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.rollup_from_project(new.id);
  elsif tg_op = 'UPDATE' then
    if old.goal_id is distinct from new.goal_id and old.goal_id is not null then
      perform public.recompute_goal_progress(old.goal_id);
    end if;
    perform public.rollup_from_project(new.id);
  elsif tg_op = 'DELETE' then
    delete from public.progress_cache where entity_type = 'project' and entity_id = old.id;
    if old.goal_id is not null then
      perform public.recompute_goal_progress(old.goal_id);
    end if;
  end if;
  return null;
end
$$;
--> statement-breakpoint

drop trigger if exists projects_progress on public.projects;
--> statement-breakpoint
create trigger projects_progress
  after insert or update of goal_id, weight, deleted_at or delete on public.projects
  for each row execute function public.projects_progress_trigger();
--> statement-breakpoint

create or replace function public.goals_progress_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.progress_cache where entity_type = 'goal' and entity_id = old.id;
    if old.vision_id is not null then
      perform public.recompute_vision_progress(old.vision_id);
    end if;
    return null;
  end if;
  perform public.recompute_goal_progress(new.id);
  if tg_op = 'UPDATE' and old.vision_id is distinct from new.vision_id and old.vision_id is not null then
    perform public.recompute_vision_progress(old.vision_id);
  end if;
  if new.vision_id is not null then
    perform public.recompute_vision_progress(new.vision_id);
  end if;
  return null;
end
$$;
--> statement-breakpoint

drop trigger if exists goals_progress on public.goals;
--> statement-breakpoint
create trigger goals_progress
  after insert or update of manual_progress, vision_id, status, deleted_at or delete on public.goals
  for each row execute function public.goals_progress_trigger();