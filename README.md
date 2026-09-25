# دوّنلي

منظومة إنتاجية شخصية هرمية مبنية بـ React وVite وSupabase.

## التشغيل المحلي

1. انسخ `.env.example` إلى `.env` واضبط عنوان Supabase ومفتاح `anon`.
2. ثبّت الحزم: `npm install`.
3. طبّق migrations الموجودة في `supabase/migrations` على مشروع Supabase.
4. للتطوير: `npm run dev`.
5. لمحاكاة الإنتاج: `npm run build` ثم `npm start`.

## بوابات الجودة

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit --audit-level=high`

ميزات Gemini متاحة للمستخدم المسجل فقط. يدخل المستخدم authorization key من الواجهة، ويظل المفتاح في ذاكرة الصفحة فقط ولا يُحفظ في التخزين المحلي أو قاعدة البيانات أو السجلات.

## النشر على Vercel

اضبط `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` في بيئة Vercel. ملفات TypeScript داخل `api/` تشغّل API، بينما يعالج fallback في `vercel.json` روابط SPA العميقة بعد أولوية نظام الملفات.

## جدولة إشعارات الخلفية عبر Supabase Cron

بعد تطبيق migration `202609250005_push_cron.sql` وتعيين `CRON_SECRET` نفسه في Vercel، فعّل إضافات **pg_cron** و**pg_net** و**Supabase Vault** من لوحة Supabase. بعدها، شغّل التالي مرة واحدة من SQL Editor؛ لا تحفظ المفتاح في ملف أو في الواجهة:

```sql
select public.dawenli_configure_push_cron(
  'https://YOUR-DEPLOYMENT.vercel.app/api/push/dispatch',
  'THE_SAME_CRON_SECRET_FROM_VERCEL'
);
```

تنشئ العملية مهمة كل دقيقة. ملخص المهام يرسل عند 09:00 فقط حسب المنطقة الزمنية للاشتراك، والأذان يرسل عند دقيقته. سجل التسليم يمنع الإرسال المكرر عند إعادة تشغيل المهمة.
