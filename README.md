# دوّنلي

منظومة إنتاجية شخصية هرمية مبنية بـ React وVite وSupabase.

## المتطلبات والتشغيل المحلي

يتطلب المشروع Node.js `22.14.x` وnpm `10+`. يمكن لمستخدمي nvm تشغيل `nvm use` لقراءة الإصدار من `.nvmrc`.

1. ثبّت الحزم تثبيتًا قابلًا للتكرار: `npm ci`.
2. شغّل Docker Desktop ثم `npx supabase start`؛ يعمل Studio على `http://127.0.0.1:54323` وMailpit على `http://127.0.0.1:54324`.
3. استخدم `npx supabase status -o env` لقراءة مفاتيح البيئة المحلية، وضعها في `.env.local` و`.env` كما هو موضح في `.env.example`؛ لا تحفظ ملفات البيئة في Git.
4. لإعادة بناء قاعدة البيانات المحلية من جميع migrations شغّل `npx supabase db reset`.
5. للتطوير: `npm run dev`. ولمحاكاة الإنتاج كاملة: `npm run build` ثم `npm start`.
6. لإيقاف الخدمات مع الاحتفاظ بالبيانات المحلية شغّل `npx supabase stop`.

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
- `npm run test:supabase`: ينشئ مستخدمين مؤقتين ويتحقق محليًا أو سحابيًا من Auth وعزل RLS ورفض anonymous RPC وCAS والمزامنة، ثم يحذفهما.
- `npm run test:supabase:security:local`: يشغّل فحوصات RLS وRPC وملكية العلاقات على قاعدة Supabase المحلية.
- `npm run test:supabase:lint`: يفشل عند وجود أي warning أو error في دوال أو schema قاعدة البيانات المحلية.
- `npm run test:supabase:security`: يشغّل الفحوصات نفسها على مشروع سحابي عبر Supabase Management API.

يشغّل `npm run test:e2e` بناءً وخادمًا محليين تلقائيًا على `http://127.0.0.1:3000` ويستخدم Chromium المدار بواسطة Playwright. لاختبار نسخة منشورة صراحةً، اضبط `PLAYWRIGHT_BASE_URL` ثم شغّل `npm run test:e2e:production`؛ القيمة الافتراضية لذلك الأمر فقط هي `https://dawenli-green.vercel.app`.

محليًا يحتاج `npm run test:supabase` إلى `SUPABASE_URL` و`SUPABASE_ANON_KEY` و`SUPABASE_SERVICE_ROLE_KEY`. سحابيًا يمكنه جلب المفاتيح باستخدام `SUPABASE_ACCESS_TOKEN` عند عدم ضبطها مباشرة. لا تحفظ أي token أو secret في المستودع.

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
