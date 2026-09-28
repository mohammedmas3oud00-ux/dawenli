-- Allow Inbox items converted into Calendar Events.
alter table public.inbox_items drop constraint if exists inbox_items_converted_to_check;
alter table public.inbox_items add constraint inbox_items_converted_to_check check (converted_to in ('task','project','goal','habit','vault','calendar_event')) not valid;
