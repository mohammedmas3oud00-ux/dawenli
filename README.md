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
