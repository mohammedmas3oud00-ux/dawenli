-- Store Quran khatma daily targets using the standard hizb-quarter model.
-- One juz = 2 hizb = 8 quarters; in the Madinah mushaf a quarter is approximately 2.5 pages.
alter table public.quran_khatmas
  alter column daily_target_pages type numeric using daily_target_pages::numeric;

update public.worship_definitions
set target_pages = 2.5,
    updated_at = now()
where category = 'quran_wird'
  and target_pages = 5
  and (title ilike '%ربع%' or title ilike '%ورد القرآن%');

update public.quran_khatmas khatma
set daily_target_pages = 2.5,
    updated_at = now()
from public.worship_definitions definition
where khatma.worship_id = definition.id
  and definition.category = 'quran_wird'
  and definition.target_pages = 2.5
  and khatma.daily_target_pages = 5;
