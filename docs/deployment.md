# النشر والاستضافة (مجاني بالكامل)

## 1. الخدمات

| الطبقة                           | الخدمة            | الخطة     | ما تحصل عليه                                                  | القيود                                                     |
| -------------------------------- | ----------------- | --------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| Web + API                        | **Vercel**        | Hobby     | نشر تلقائي من GitLab، SSL، Edge network، دومين مخصص           | استخدام غير تجاري؛ 100GB bandwidth؛ مهلة Serverless محدودة |
| Database + Auth + Storage + Cron | **Supabase**      | Free      | Postgres 500MB، 50k MAU، 1GB Storage، pg_cron، Edge Functions | يتوقف بعد 7 أيام خمول (نحلها بالـ keep-alive)؛ مشروعان فقط |
| Rate limiting (لاحقاً)           | **Upstash Redis** | Free      | 10k أمر/يوم                                                   | كافٍ للـ API الشخصي                                        |
| Email (Phase 3)                  | **Resend**        | Free      | 3000 رسالة/شهر                                                | دومين واحد                                                 |
| Monitoring (Phase 6)             | **Sentry**        | Developer | 5k خطأ/شهر                                                    |                                                            |
| CI/CD                            | **GitLab**        | Free      | 400 دقيقة/شهر                                                 | كافية للـ lint/test                                        |

---

## 2. خطوات الإعداد الأولي

### 2.1 Supabase

1. أنشئ مشروعاً (اختر أقرب Region: `eu-central-1` Frankfurt).
2. Authentication → Providers: فعّل Email و Google (أنشئ OAuth client في Google Cloud Console).
3. Authentication → URL Configuration:
   - Site URL: `https://app.<domain>`
   - Redirect URLs: `https://app.<domain>/**`, `http://localhost:3000/**`
4. Database → Extensions: فعّل `pg_cron`, `pgcrypto`, (لاحقاً `vector`).
5. Storage → أنشئ bucket `attachments` (Private).
6. احفظ: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (Transaction pooler, port 6543).

### 2.2 Vercel

1. Import Git Repository → GitLab → `0bawsala/bawsala`.
2. Root Directory: `apps/web`؛ Framework: Next.js؛ Build Command يُكتشف عبر Turborepo.
3. Environment Variables (Production + Preview):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server only
DATABASE_URL=                     # pooler
NEXT_PUBLIC_APP_URL=https://app.<domain>
CRON_SECRET=                      # لحماية /api/v1/health
```

4. Settings → Domains → أضف `app.<domain>`.

### 2.3 DNS (عند مزود الدومين)

```
Type   Name   Value
CNAME  app    cname.vercel-dns.com
```

SSL يصدر تلقائياً خلال دقائق. لو الدومين على Cloudflare: اجعل السجل **DNS only** (سحابة رمادية) لتجنب تعارض الـ Proxy مع Vercel.

### 2.4 GitLab

**CI Variables** (Settings → CI/CD → Variables، Masked):

- `DATABASE_URL` (لتشغيل migrations من CI عند الحاجة)
- `HEALTH_URL` = `https://app.<domain>/api/v1/health`
- `CRON_SECRET`

**Scheduled Pipeline** (CI/CD → Schedules): يومياً، متغير `KEEP_ALIVE=true`.

---

## 3. `.gitlab-ci.yml` المقترح

```yaml
stages: [quality, migrate, keepalive]

default:
  image: node:22-alpine
  before_script:
    - corepack enable && corepack prepare pnpm@latest --activate
    - pnpm install --frozen-lockfile
  cache:
    key: { files: [pnpm-lock.yaml] }
    paths: [.pnpm-store]

quality:
  stage: quality
  script:
    - pnpm turbo lint typecheck test
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

migrate:
  stage: migrate
  script:
    - pnpm --filter @bawsala/db migrate
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes: [packages/db/**/*]

keepalive:
  stage: keepalive
  image: curlimages/curl:latest
  before_script: []
  cache: []
  script:
    - curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$HEALTH_URL"
  rules:
    - if: $KEEP_ALIVE == "true"
```

النشر نفسه يتم عبر Vercel Git Integration (Preview لكل MR، Production عند الدمج في `main`)، فلا نستهلك دقائق CI فيه.

---

## 4. البيئات

| البيئة     | الفرع  | الرابط           | القاعدة                                             |
| ---------- | ------ | ---------------- | --------------------------------------------------- |
| Local      | أي     | `localhost:3000` | Supabase CLI (Docker) أو مشروع Supabase ثانٍ        |
| Preview    | كل MR  | `*.vercel.app`   | نفس قاعدة الإنتاج (شخصي) — أو المشروع الثاني للأمان |
| Production | `main` | `app.<domain>`   | Supabase الرئيسي                                    |

---

## 5. النسخ الاحتياطي

الخطة المجانية في Supabase لا تشمل نسخاً احتياطياً آلياً. الحل:

- GitLab Scheduled Pipeline أسبوعي يشغّل `pg_dump` ويحفظ الناتج كـ **Artifact** (مشفر بـ `age` أو `gpg`، مدة احتفاظ 4 أسابيع).
- أو زر "تصدير بياناتي" داخل التطبيق (موجود منذ MVP) يُستخدم شهرياً.

---

## 6. متى تنتقل للخطة المدفوعة؟

| المؤشر                                 | الإجراء                                           |
| -------------------------------------- | ------------------------------------------------- |
| قاعدة البيانات > 400MB                 | Supabase Pro (25$)                                |
| مستخدمون خارجيون أو دفع                | Vercel Pro (20$) إلزامي بموجب شروط Hobby          |
| حاجة لنسخ احتياطي يومي آلي             | Supabase Pro                                      |
| Serverless timeouts في مهام AI الطويلة | Vercel Pro أو نقل المهمة لـ Edge Function / Queue |
