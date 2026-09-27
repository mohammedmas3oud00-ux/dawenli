-- Structured reading/course progress, separate from existing free-text notes.
alter table public.vault_items add column if not exists learning jsonb;
