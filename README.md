# Bawsala (بوصلة)

نظام تشغيل شخصي للإنتاجية يربط الرؤية طويلة المدى بالتنفيذ اليومي.

```
Vision → Goals → Areas → Projects → Tasks → Daily Actions → Habits → Reviews
```

## الوثائق

| الوثيقة | المحتوى |
|---|---|
| [docs/architecture.md](docs/architecture.md) | الرؤية، المبادئ، مخطط النظام، Frontend/Backend، Auth، Storage، Jobs، محرك الأولويات، التقدم، AI، الموبايل، مسار SaaS، ADRs |
| [docs/database-schema.md](docs/database-schema.md) | ERD، الجداول، RLS، Functions/Triggers، ترتيب Migrations |
| [docs/project-structure.md](docs/project-structure.md) | هيكل الـ Monorepo وقواعد التنظيم |
| [docs/roadmap.md](docs/roadmap.md) | المراحل الست مع Definition of Done |
| [docs/deployment.md](docs/deployment.md) | Vercel + Supabase + GitLab CI + الدومين الفرعي (مجاني بالكامل) |

## الـ Stack

- **Web + API:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui, next-intl (ar/en + RTL)
- **Data:** PostgreSQL على Supabase, Drizzle ORM, RLS, pg_cron
- **Auth & Storage:** Supabase
- **Hosting:** Vercel (Hobby) — صفر تكلفة للاستخدام الشخصي
- **Mobile (لاحقاً):** Expo / React Native مع إعادة استخدام `packages/core`

## الحالة

مرحلة **تصميم المعمارية**. لا يبدأ الكود قبل الموافقة على الوثائق أعلاه.
