-- Keep local and hosted environments consistent for the server-only push scheduler.
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- Extension schemas are infrastructure-only; browser roles must not invoke them directly.
revoke all on schema cron from public, anon, authenticated;
revoke all on schema net from public, anon, authenticated;
