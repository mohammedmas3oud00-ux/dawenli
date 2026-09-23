# هيكل المشروع (Monorepo)

> pnpm workspaces + Turborepo

```
bawsala/
├── apps/
│   ├── web/                          # Next.js (App Router) — الويب + API
│   └── mobile/                       # Expo / React Native (Phase 5)
├── packages/
│   ├── core/                         # منطق الأعمال المشترك (بدون أي اعتماد على React أو Next)
│   ├── db/                           # Drizzle schema + migrations + seed
│   ├── ui/                           # مكونات shadcn المشتركة + tokens (Phase 5 عند الحاجة)
│   ├── i18n/                         # ملفات الترجمة ar/en
│   ├── api-client/                   # Typed client لـ /api/v1 (للموبايل)
│   ├── ai/                           # LLM adapters (Phase 4)
│   └── config/                       # eslint, tsconfig, tailwind presets
├── docs/                             # هذه الوثائق
├── .gitlab-ci.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## apps/web

```
apps/web/
├── app/
│   ├── [locale]/                     # ar | en
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── callback/route.ts     # OAuth callback
│   │   ├── (app)/                    # محمي بالـ middleware
│   │   │   ├── layout.tsx            # Sidebar + Topbar
│   │   │   ├── today/page.tsx        # الصفحة الرئيسية: مهام اليوم + عادات + طاقة
│   │   │   ├── inbox/page.tsx
│   │   │   ├── vision/page.tsx
│   │   │   ├── goals/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── areas/
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── tasks/
│   │   │   ├── habits/
│   │   │   │   ├── page.tsx
│   │   │   │   └── spiritual/page.tsx
│   │   │   ├── reviews/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [type]/[date]/page.tsx
│   │   │   ├── notes/                # Phase 3
│   │   │   ├── library/              # Phase 3: books + courses
│   │   │   ├── time/                 # Phase 3
│   │   │   ├── templates/
│   │   │   └── settings/
│   │   ├── layout.tsx                # html dir/lang + providers
│   │   └── not-found.tsx
│   ├── api/
│   │   └── v1/
│   │       ├── health/route.ts
│   │       ├── me/route.ts
│   │       ├── goals/route.ts
│   │       ├── goals/[id]/route.ts
│   │       ├── tasks/route.ts
│   │       ├── tasks/[id]/route.ts
│   │       ├── tasks/[id]/complete/route.ts
│   │       ├── tasks/recommendations/route.ts
│   │       ├── habits/...
│   │       ├── reviews/...
│   │       └── progress/vision/route.ts
│   └── globals.css
├── features/                         # Feature-sliced: كل ميزة مستقلة
│   ├── tasks/
│   │   ├── components/
│   │   │   ├── task-list.tsx
│   │   │   ├── task-item.tsx
│   │   │   ├── task-form.tsx
│   │   │   ├── task-quick-add.tsx
│   │   │   └── eisenhower-matrix.tsx
│   │   ├── hooks/
│   │   │   └── use-tasks.ts          # TanStack Query hooks
│   │   ├── actions.ts                # Server Actions → core services
│   │   ├── queries.ts                # قراءة (RSC)
│   │   └── index.ts
│   ├── goals/
│   ├── projects/
│   ├── habits/
│   ├── reviews/
│   ├── vision/
│   ├── progress/                     # شجرة Top-down + مؤشرات
│   ├── auth/
│   └── settings/
├── components/
│   ├── ui/                           # shadcn (button, dialog, input, ...)
│   ├── layout/                       # sidebar, topbar, page-header, empty-state
│   └── shared/                       # date-picker, locale-switcher, theme-toggle
├── lib/
│   ├── supabase/
│   │   ├── server.ts                 # createServerClient (cookies)
│   │   ├── client.ts                 # createBrowserClient
│   │   └── middleware.ts
│   ├── db.ts                         # Drizzle instance
│   ├── auth.ts                       # getCurrentUser(), requireUser()
│   ├── api/
│   │   ├── handler.ts                # wrapper: auth + zod + error → Response
│   │   └── errors.ts
│   ├── utils.ts                      # cn(), formatters
│   └── constants.ts
├── stores/                           # Zustand: ui-store, focus-timer-store
├── hooks/                            # use-media-query, use-hotkeys, use-locale
├── messages/                         # → symlink أو import من packages/i18n
├── middleware.ts                     # locale + auth session refresh
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## packages/core

```
packages/core/
├── src/
│   ├── schemas/                      # Zod — مصدر الحقيقة للأنواع
│   │   ├── task.ts
│   │   ├── goal.ts
│   │   ├── project.ts
│   │   ├── habit.ts
│   │   ├── review.ts
│   │   └── index.ts
│   ├── services/                     # منطق الأعمال، يستلم db كمعامل (Dependency Injection بسيط)
│   │   ├── tasks.service.ts
│   │   ├── goals.service.ts
│   │   ├── projects.service.ts
│   │   ├── habits.service.ts
│   │   ├── reviews.service.ts
│   │   └── progress.service.ts
│   ├── engines/                      # دوال نقية قابلة للاختبار 100%
│   │   ├── priority.ts               # computePriorityScore(), eisenhowerQuadrant()
│   │   ├── progress.ts               # rollup helpers
│   │   ├── streaks.ts                # computeStreak(logs, frequency, tz)
│   │   └── recurrence.ts             # RRULE → next occurrences
│   ├── errors.ts                     # AppError + codes
│   ├── constants.ts                  # defaults, weights, enums
│   └── index.ts
├── tests/                            # Vitest
└── package.json
```

## packages/db

```
packages/db/
├── schema/
│   ├── profiles.ts
│   ├── hierarchy.ts                  # visions, areas, goals, projects, tasks, progress_cache
│   ├── habits.ts
│   ├── reviews.ts
│   ├── knowledge.ts
│   ├── learning.ts
│   ├── time.ts
│   └── index.ts
├── migrations/                       # drizzle-kit generate
├── sql/                              # RLS policies, functions, triggers, cron
│   ├── 0001_rls.sql
│   ├── 0002_functions.sql
│   └── 0003_cron.sql
├── seed/
│   ├── templates.ts                  # قوالب النظام
│   └── habit-categories.ts
├── drizzle.config.ts
└── package.json
```

## packages/i18n

```
packages/i18n/
├── messages/
│   ├── ar.json
│   └── en.json
├── config.ts                         # locales, defaultLocale, rtlLocales
└── package.json
```

---

## قواعد التنظيم

1. **لا يستورد** `features/*` من `features/*` آخر مباشرة؛ التشارك عبر `packages/core` أو `components/shared`.
2. **لا منطق أعمال** في `app/` أو `components/`؛ فقط تركيب واستدعاء.
3. **الأنواع** تُستنتج من Zod (`z.infer`) ولا تُكرر يدوياً.
4. **الأسماء:** ملفات `kebab-case`، مكونات `PascalCase`، دوال `camelCase`، جداول `snake_case`.
5. **الاختبارات:** `engines/` تغطية كاملة بـ Vitest؛ `services/` اختبارات تكامل على قاعدة محلية (Supabase CLI).
