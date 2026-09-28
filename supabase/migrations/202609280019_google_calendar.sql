-- Server-only Google Calendar connection and mapping state.
create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text,
  calendar_id text not null default 'primary',
  refresh_token_ciphertext text not null,
  refresh_token_iv text not null,
  refresh_token_auth_tag text not null,
  sync_token text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.google_calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calendar_event_id uuid not null,
  google_event_id text not null,
  google_etag text,
  google_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, calendar_event_id),
  unique (user_id, google_event_id)
);

alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_event_links enable row level security;
revoke all on table public.google_calendar_connections, public.google_calendar_event_links from anon, authenticated;

create index if not exists google_calendar_links_user_idx on public.google_calendar_event_links(user_id);
