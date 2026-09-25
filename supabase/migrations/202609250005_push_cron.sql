-- Background push delivery: one job per minute, configured through Supabase Vault.
-- After this migration, run dawelnli_configure_push_cron from the SQL editor once.

create table if not exists public.push_delivery_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  delivery_key text not null,
  created_at timestamptz not null default now(),
  unique (subscription_id, delivery_key)
);

alter table public.push_delivery_log enable row level security;
revoke all on table public.push_delivery_log from anon, authenticated;

-- This is intentionally not exposed to app users. Run it only as a database admin.
create or replace function public.dawenli_configure_push_cron(
  p_dispatch_url text,
  p_cron_secret text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_secret_id uuid;
begin
  if p_dispatch_url !~ '^https://[^[:space:]]+/api/push/dispatch$' then
    raise exception 'p_dispatch_url must be an HTTPS /api/push/dispatch URL';
  end if;
  if length(p_cron_secret) < 32 then
    raise exception 'p_cron_secret must be at least 32 characters';
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_cron')
    or not exists (select 1 from pg_extension where extname = 'pg_net')
    or not exists (select 1 from pg_extension where extname = 'supabase_vault') then
    raise exception 'Enable pg_cron, pg_net, and supabase_vault before configuring push cron';
  end if;

  select id into v_secret_id from vault.secrets where name = 'dawenli_push_dispatch_url' limit 1;
  if v_secret_id is null then
    perform vault.create_secret(p_dispatch_url, 'dawenli_push_dispatch_url', 'Dawenli protected push dispatch URL');
  else
    perform vault.update_secret(v_secret_id, p_dispatch_url, 'dawenli_push_dispatch_url', 'Dawenli protected push dispatch URL');
  end if;

  select id into v_secret_id from vault.secrets where name = 'dawenli_push_cron_secret' limit 1;
  if v_secret_id is null then
    perform vault.create_secret(p_cron_secret, 'dawenli_push_cron_secret', 'Dawenli protected push dispatch authorization');
  else
    perform vault.update_secret(v_secret_id, p_cron_secret, 'dawenli_push_cron_secret', 'Dawenli protected push dispatch authorization');
  end if;

  perform cron.unschedule(jobid) from cron.job where jobname = 'dawenli-push-dispatch';
  perform cron.schedule(
    'dawenli-push-dispatch',
    '* * * * *',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'dawenli_push_dispatch_url'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'dawenli_push_cron_secret')
        ),
        body := '{}'::jsonb
      );
    $cron$
  );
end;
$$;

revoke all on function public.dawenli_configure_push_cron(text, text) from public, anon, authenticated;
