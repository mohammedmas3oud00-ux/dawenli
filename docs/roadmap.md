# خارطة الطريق

> أسلوب العمل: **Vertical slices** — كل ميزة تُبنى Database → Service → API/Action → UI وتُختبر قبل التالية.
> المدد تقديرية لمطور واحد بدوام جزئي.

---

## Phase 1 — الأساس (2-3 أسابيع)

**الهدف:** هيكل يعمل end-to-end يمكن نشره على الدومين الفرعي.

- [ ] Monorepo: pnpm + Turborepo + `packages/config` (eslint, prettier, tsconfig)
- [ ] `apps/web`: Next.js + Tailwind + shadcn + next-themes
- [ ] `packages/i18n` + next-intl + RTL (اختبار كل مكوّن بالعربية أولاً)
- [ ] Supabase project + `packages/db` (Drizzle) + migration `0001_profiles`
- [ ] Auth كامل: تسجيل، دخول، Google، Magic link، `middleware.ts`
- [ ] Layout: Sidebar + Topbar + Command palette (⌘K) + Theme/Locale toggles
- [ ] `lib/api/handler.ts` + `/api/v1/health` + `/api/v1/me`
- [ ] GitLab CI: lint + typecheck + test؛ Vercel Git integration؛ ربط الدومين الفرعي
- [ ] GitLab Scheduled pipeline للـ keep-alive

**Definition of Done:** تسجيل دخول بالعربية والإنجليزية، Dark mode، على `app.<domain>` بـ SSL.

---

## Phase 2 — نظام الإنتاجية الأساسي (6-8 أسابيع)

### 2.1 الهرم (أسبوعان)

- [x] migration `0002_hierarchy` + RLS + progress triggers
- [ ] Vision: صفحة واحدة، تحرير النص، عرض الأهداف المرتبطة
- [ ] Areas: CRUD + أيقونات
- [x] Goals: CRUD، الهرم (annual → quarterly → monthly → life)، metric، manual progress
- [x] Projects: CRUD، ربط بهدف/مجال، شريط تقدم

### 2.2 المهام ومحرك الأولويات (أسبوعان)

- [x] Tasks CRUD + Subtasks + Quick add (لغة طبيعية بسيطة: `#project`, `!p1`, `@tomorrow`)
- [x] `engines/priority.ts` + اختبارات + Eisenhower matrix view
- [x] Views: Today، Inbox، Upcoming، by Project
- [ ] Recurrence (RRULE) للمهام المتكررة
- [x] `/api/v1/tasks/recommendations`
- [x] صفحة Today: مهام اليوم مرتبة + "لماذا هذه المهمة؟" (سلسلة Task → Project → Goal → Vision)

### 2.3 العادات (أسبوعان)

- [x] migration `0003_habits` + seed الفئات
- [x] Habits CRUD (daily/weekly/monthly، value types)
- [x] Habit logs + `engines/streaks.ts`
- [x] القسم الروحي: preset الصلوات الخمس (on_time/late/missed/jamaah)، تتبع القرآن بالصفحات، الأذكار كـ checklist
- [ ] Analytics: Heatmap سنوي، نسبة الإنجاز، أطول Streak

### 2.4 المراجعات (أسبوع)

- [x] migration `0004_templates_reviews` + قوالب النظام
- [x] Daily review: مزاج، طاقة، إنجازات، إخفاقات، دروس، تخطيط الغد (يحدّث `profiles.current_energy`)
- [ ] Weekly review: snapshot آلي (مهام، مشاريع، عادات) + أسئلة القالب
- [ ] Monthly / Quarterly / Yearly: نفس المحرك بقوالب مختلفة

### 2.5 التلميع ولوحة القيادة (أسبوع)

- [x] Dashboard: مؤشرات KPI موحدة + أولويات Eisenhower Q1 + معمارية الربط الهرمي
- [x] Focus Flowtime Timer: جلسات العمل العميق المرنة والمؤقت الصوتي
- [ ] Progress tree (Top-down) في صفحة Vision
- [ ] تصدير البيانات JSON + حذف الحساب
- [ ] PWA: manifest + service worker + أيقونات
- [ ] Keyboard shortcuts، Empty states، Loading skeletons

**Definition of Done:** استخدام يومي حقيقي للنظام لمدة أسبوعين دون الحاجة لأداة أخرى للمهام والعادات.

---

## Phase 3 — المعرفة والتعلم والوقت (6-8 أسابيع)

- [ ] migration `0005_knowledge`: Notes (Tiptap)، روابط `[[wikilinks]]`، Tags، PARA، بحث نصي كامل
- [ ] Backlinks panel + Graph view بسيط
- [ ] Attachments عبر Supabase Storage
- [ ] migration `0006_learning`: Books + Highlights + Courses + Lessons + Skills، ربط بالأهداف
- [ ] migration `0007_time`: Time entries، مؤقت Focus (Pomodoro / Flowtime / Deep work)، تقارير أين يذهب الوقت
- [ ] Google Calendar (قراءة فقط أولاً) لعرض الالتزامات بجانب المهام
- [ ] Templates UI: بناء قوالب مخصصة (Daily plan، Project، Journal، Learning plan)
- [ ] تذكيرات بالبريد عبر Resend

---

## Phase 4 — الذكاء الاصطناعي (4-6 أسابيع)

- [ ] `packages/ai` + adapters (OpenAI / Anthropic / Gemini / Ollama)
- [ ] إعدادات: مفتاح API خاص بالمستخدم (BYOK) للبقاء مجانياً
- [ ] تفكيك هدف → مشاريع ومهام (مع مراجعة قبل الحفظ)
- [ ] "خطط يومي": إعادة ترتيب + تبرير
- [ ] تلخيص المراجعة الأسبوعية واستخراج الأنماط
- [ ] `pgvector` + Embeddings: ملاحظات مرتبطة مقترحة، بحث دلالي

---

## Phase 5 — تطبيق الموبايل (6-8 أسابيع)

- [ ] `packages/api-client` (typed fetch + zod parsing)
- [ ] `apps/mobile` Expo: Auth، Today، Tasks، Habits، Quick capture
- [ ] Offline queue للمهام والعادات
- [ ] Push notifications (Expo) للتذكيرات
- [ ] Widgets (iOS/Android) لعادات اليوم
- [ ] نشر داخلي (TestFlight / Internal testing)

---

## Phase 6 — التحويل إلى SaaS (4-6 أسابيع)

- [ ] migration `0009_workspaces` + تحديث RLS
- [ ] Plans + Feature flags
- [ ] الفوترة: Lemon Squeezy أو Paddle
- [ ] `apps/landing` + Onboarding
- [ ] Vercel Pro + Supabase Pro، مراقبة (Sentry، Vercel Analytics)
- [ ] سياسة الخصوصية + الشروط + GDPR export/delete
- [ ] تقييم استخراج API إلى NestJS حسب الحمل

---

## مقاييس النجاح لكل مرحلة

| المرحلة | المقياس                                   |
| ------- | ----------------------------------------- |
| 1       | نشر يعمل على الدومين الفرعي، CI أخضر      |
| 2       | استخدام شخصي يومي لأسبوعين متواصلين       |
| 3       | استبدال أدوات الملاحظات والقراءة الحالية  |
| 4       | 50% من الأهداف الجديدة تُفكك بمساعدة AI   |
| 5       | 80% من تسجيل العادات يحدث من الهاتف       |
| 6       | أول 10 مستخدمين خارجيين، أول اشتراك مدفوع |
