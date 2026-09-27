-- Legacy Quran records used a page target of 1, which is below the product's
-- minimum unit (one quarter juz ≈ 5 pages). Preserve progress; only normalize
-- the configured target upward.
update public.worship_definitions
set target_pages = greatest(coalesce(target_pages, 5), 5),
    updated_at = coalesce(updated_at, now())
where category = 'quran_wird';

update public.quran_khatmas khatma
set daily_target_pages = greatest(coalesce(khatma.daily_target_pages, 5), 5),
    updated_at = coalesce(khatma.updated_at, now())
where khatma.worship_id in (select id from public.worship_definitions where category = 'quran_wird');
