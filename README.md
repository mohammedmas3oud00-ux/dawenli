# دوّنلي

منظومة إنتاجية شخصية هرمية مبنية بـ React وVite وSupabase.

## المتطلبات والتشغيل المحلي

يتطلب المشروع Node.js `22.14.x` وnpm `10+`. يمكن لمستخدمي nvm تشغيل `nvm use` لقراءة الإصدار من `.nvmrc`.

1. انسخ `.env.example` إلى `.env` واضبط عنوان Supabase ومفتاح `anon`.
2. ثبّت الحزم تثبيتًا قابلًا للتكرار: `npm ci`.
3. طبّق migrations الموجودة في `supabase/migrations` على مشروع Supabase بالترتيب، بما فيها `202610020001_supabase_integrity_and_snapshot_cas.sql` قبل تشغيل النسخة الجديدة.
4. للتطوير: `npm run dev`.
5. لمحاكاة الإنتاج كاملة: `npm run build` ثم `npm start`.

يسجّل التطبيق Service Worker في وضع الإنتاج فقط؛ لذلك اختبر PWA بعد `npm run build` و`npm start` وليس عبر خادم التطوير.

## بوابات الجودة

- `npm run lint`: ESLint لـ React وTypeScript وReact Hooks وJSX accessibility.
- `npm run typecheck`: يفحص التطبيق والخادم والاختبارات وتهيئات Vitest وPlaywright.
- `npm test`: اختبارات الوحدة مرة واحدة.
- `npm run test:coverage`: تغطية V8 مع حدود دنيا تدريجية في `vitest.config.ts`.
- `npm run build`: بناء الواجهة والخادم كاملًا.
- `npm audit --omit=dev --audit-level=high`: تدقيق اعتماديات الإنتاج.
- `npm run format:check`: يتحقق من Prettier للملفات الجديدة والمهيأة ضمن البوابة التدريجية، بدون إعادة تنسيق الملفات القديمة.
- `npm run format:check:all`: فحص Prettier الكامل للمستودع، ويعرض تنسيق legacy المتبقي.
- `npm run test:supabase:security`: يشغّل فحوصات SQL الأمنية plain SQL عبر Supabase Management API.

يشغّل `npm run test:e2e` بناءً وخادمًا محليين تلقائيًا على `http://127.0.0.1:3000` ويستخدم Chromium المدار بواسطة Playwright. لاختبار نسخة منشورة صراحةً، اضبط `PLAYWRIGHT_BASE_URL` ثم شغّل `npm run test:e2e:production`؛ القيمة الافتراضية لذلك الأمر فقط هي `https://dawenli-green.vercel.app`.

يتطلب `npm run test:supabase` كلًا من `VITE_SUPABASE_URL` و`SUPABASE_ACCESS_TOKEN`، ولا ينبغي حفظ management token في المستودع.

## الأسرار والتخزين

بيانات الضيف محفوظة محليًا في المتصفح وليست مخزن أسرار. بيانات الحساب السحابي تمر عبر Supabase وسياسات RLS. مفتاح Gemini الذي يدخله المستخدم لا يُحفظ في `localStorage`: يرسله التطبيق إلى API المصادق، ويشفّره الخادم بخوارزمية AES-256-GCM قبل حفظ ciphertext وIV وauthentication tag في Supabase. تُشفّر Google refresh tokens بالطريقة نفسها. اضبط `GEMINI_KEY_ENCRYPTION_SECRET` إلى قيمة عشوائية طويلة وثابتة؛ تغييرها يجعل القيم المشفرة القديمة غير قابلة للفك حتى يعيد المستخدم ربطها.

لا تضع `SUPABASE_SERVICE_ROLE_KEY` أو `GOOGLE_CLIENT_SECRET` أو `VAPID_PRIVATE_KEY` أو `CRON_SECRET` أو `SUPABASE_ACCESS_TOKEN` في متغير يبدأ بـ `VITE_`، لأن متغيرات Vite تصل إلى حزمة المتصفح.

## Google وPush

لتفعيل زر Google في الواجهة اضبط `VITE_ENABLE_GOOGLE_AUTH=true`. يحتاج تكامل Google Calendar على الخادم إلى `GOOGLE_CLIENT_ID` و`GOOGLE_CLIENT_SECRET` و`GOOGLE_REDIRECT_URI` و`GOOGLE_POST_CONNECT_REDIRECT` بالإضافة إلى `GEMINI_KEY_ENCRYPTION_SECRET` وSupabase server variables. يجب أن يطابق redirect URI المسجل لدى Google المسار `/api/integrations/google/callback` تمامًا.

تحتاج إشعارات Web Push إلى زوج `VAPID_PUBLIC_KEY` و`VAPID_PRIVATE_KEY` متطابق، و`VAPID_SUBJECT` صالح، و`CRON_SECRET` لطلب dispatch المجدول. لا ترسل private key إلى العميل.

## النشر على Vercel

اضبط `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` ومتغيرات الخادم المطلوبة في بيئة Vercel. ملفات TypeScript داخل `api/` تشغّل API، بينما يعالج fallback في `vercel.json` روابط SPA العميقة بعد أولوية نظام الملفات. يضيف `vercel.json` كذلك headers أمنية وسياسة عدم تخزين مؤقت لـ Service Worker.

## جدولة إشعارات الخلفية عبر Supabase Cron

بعد تطبيق migration `202609250008_push_cron.sql` وتعيين `CRON_SECRET` نفسه في Vercel، فعّل إضافات **pg_cron** و**pg_net** و**Supabase Vault** من لوحة Supabase. بعدها، شغّل التالي مرة واحدة من SQL Editor؛ لا تحفظ المفتاح في ملف أو في الواجهة:

```sql
select public.dawenli_configure_push_cron(
  'https://YOUR-DEPLOYMENT.vercel.app/api/push/dispatch',
  'THE_SAME_CRON_SECRET_FROM_VERCEL'
);
```

تنشئ العملية مهمة كل دقيقة. ملخص المهام يرسل عند 09:00 فقط حسب المنطقة الزمنية للاشتراك، والأذان يرسل عند دقيقته. سجل التسليم يمنع الإرسال المكرر عند إعادة تشغيل المهمة.
