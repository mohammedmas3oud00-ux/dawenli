create table if not exists public.gemini_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gemini_credentials enable row level security;
revoke all on public.gemini_credentials from anon, authenticated;

create or replace function public.dawenli_get_gemini_credential()
returns table(ciphertext text, iv text, auth_tag text)
language sql security definer set search_path = public, pg_temp
as $$ select g.ciphertext, g.iv, g.auth_tag from public.gemini_credentials g where g.user_id = auth.uid() $$;

create or replace function public.dawenli_save_gemini_credential(p_ciphertext text, p_iv text, p_auth_tag text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$ begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.gemini_credentials(user_id, ciphertext, iv, auth_tag)
  values (auth.uid(), p_ciphertext, p_iv, p_auth_tag)
  on conflict (user_id) do update set ciphertext=excluded.ciphertext, iv=excluded.iv, auth_tag=excluded.auth_tag, updated_at=now();
end $$;

create or replace function public.dawenli_delete_gemini_credential()
returns void language sql security definer set search_path = public, pg_temp
as $$ delete from public.gemini_credentials where user_id = auth.uid() $$;

revoke all on function public.dawenli_get_gemini_credential() from public, anon;
revoke all on function public.dawenli_save_gemini_credential(text,text,text) from public, anon;
revoke all on function public.dawenli_delete_gemini_credential() from public, anon;
grant execute on function public.dawenli_get_gemini_credential() to authenticated;
grant execute on function public.dawenli_save_gemini_credential(text,text,text) to authenticated;
grant execute on function public.dawenli_delete_gemini_credential() to authenticated;
