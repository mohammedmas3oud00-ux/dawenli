# Bawsala Life OS — Project Map

> **Single Source of Truth** for the architecture, component inventory, data models, and implementation progress of the Bawsala Personal Productivity Operating System.
> Maintained autonomously and updated after every development cycle according to the project protocol.

---

## 1. System Vision & Architecture

Bawsala is a full-stack Personal Productivity Operating System designed to connect high-level life vision to daily execution through an automated vertical hierarchy:

```
Vision (بوصلة الحياة)
  ↓
Goals (آفاق زمنية: Life, Annual, Quarterly, Monthly)
  ↓
Projects (مشاريع نشطة مع مؤشرات صحة ومتابعة)
  ↓
Tasks (مهام مصنفة عبر مصفوفة آيزنهاور ومحرك الأولويات)
  ↓
Daily Actions & Focus (جلسات Flowtime والعمل العميق)
  ↓
Habits (سلاسل العادات التراكمية والقسم الروحي للصلوات)
  ↓
Reviews (محرك المراجعات المسائية واستخلاص الدروس)
  ↓
Analytics & Dashboard (لوحة تحكم شمولية ولوحة قيادة)
```

### Core Architecture Principles
1. **Vertical Slices:** Every feature is built end-to-end: Database Schema → Drizzle Service → Server Action / API → React UI Component → Page.
2. **Bottom-Up Rollup:** Task completions roll up automatically into Project Progress, Goal Progress, and Vision Alignment Score via database triggers and cached rollups.
3. **Smart Priority Engine:** Tasks are dynamically scored based on Eisenhower quadrant (Urgency × Importance), estimated duration, goal priority, and user's current energy level (`profiles.current_energy`).
4. **Bilingual Parity:** 100% Arabic (RTL default) and English support across all UI elements, layout navigation, and error messages.
5. **Two-Agent Quality Protocol:** Antigravity implements full code slices autonomously; Claude Fable 5.1 audits git diffs via GitLab Duo CLI.

---

## 2. Monorepo Topology

```
d:\0.Bawsala/
├── apps/
│   └── web/                                # Next.js 16 (App Router + Turbopack + TailwindCSS)
│       ├── app/[locale]/(app)/             # Authenticated core application routes
│       │   ├── dashboard/                  # Executive cockpit & KPI metrics
│       │   ├── focus/                      # Flowtime & deep work timer
│       │   ├── goals/                      # Strategic horizons and goals
│       │   ├── habits/                     # Habit streaks & 5 prayer tracker
│       │   ├── projects/                   # Project health and task rollups
│       │   ├── reviews/                    # Evening reflection form & history
│       │   ├── settings/                   # User profile, theme, timezone
│       │   ├── tasks/                      # Eisenhower 2x2 matrix & quick-add
│       │   └── today/                      # Daily cockpit & energy check-in
│       ├── components/                     # Shared UI primitives (Card, Badge, Button, etc.)
│       └── features/                       # Modular feature queries, actions & components
├── packages/
│   ├── config/                             # Shared ESLint, Prettier, and TypeScript configs
│   ├── core/                               # Pure business logic engines & Zod schemas
│   │   ├── engines/                        # Priority, quick-add, streaks, spiritual, dates
│   │   └── schemas/                        # Zod validators for goals, tasks, habits, etc.
│   ├── db/                                 # Drizzle ORM schema, PostgreSQL client, migrations, services
│   │   ├── src/schema/                     # Profiles, hierarchy, habits, reviews
│   │   └── src/services/                   # Visions, areas, goals, projects, tasks, habits, reviews
│   └── i18n/                               # Next-intl configuration and dictionary files (ar.json, en.json)
├── docs/                                   # Architectural guides, roadmap, schema documentation
└── scripts/                                # Dev utilities (review-with-claude.ps1, etc.)
```

---

## 3. Database & Services Layer (`@bawsala/db`)

### Schema Migrations (`packages/db/drizzle/`)
- `0001_profiles`: User profile settings, display name, timezone, current energy (1-5).
- `0002_hierarchy`: Visions, Life Areas, Goals, Projects, Tasks, and `progress_cache` with SQL trigger rollups.
- `0003_habits`: Habits, habit categories, and `habit_logs` with streak tracking.
- `0004_templates_reviews`: Reviews table (daily, weekly, monthly) and reflection prompts.

### Service Modules (`packages/db/src/services/`)
| Service | File | Key Functions |
|---|---|---|
| **Tasks** | `tasks.service.ts` | `listTasks`, `createTask`, `updateTask`, `deleteTask`, `getEisenhowerMatrix`, `getTaskRecommendations` |
| **Habits** | `habits.service.ts` | `listHabits`, `getTodayHabitsStatus`, `createHabit`, `logHabit`, `deleteHabit`, streak calculator |
| **Reviews** | `reviews.service.ts` | `listReviews`, `getReview`, `upsertReview`, `deleteReview`, `getLatestReview` |
| **Goals** | `goals.service.ts` | `listGoals`, `getGoal`, `createGoal`, `updateGoal`, `deleteGoal`, `buildGoalTree` |
| **Projects** | `projects.service.ts` | `listProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`, `findProjectByName` |
| **Visions/Areas** | `hierarchy.service.ts` | `getVision`, `upsertVision`, `listAreas`, `createArea`, `deleteArea` |
| **Time Tracking** | `time.service.ts` | `logTimeEntry`, `listTimeEntries`, `getTimeStats` |
| **Knowledge** | `knowledge.service.ts` | `listNotes`, `getNote`, `createNote`, `updateNote`, `deleteNote`, `listResources`, `createResource`, `updateResource`, `deleteResource` |

---

## 4. Web Application Routes (`apps/web`)

| Route | Name (Ar / En) | Purpose & Key Features |
|---|---|---|
| `/[locale]/dashboard` | لوحة القيادة / Dashboard | KPI metrics, Q1 urgent tasks, bottom-up alignment visualizer, energy cockpit |
| `/[locale]/today` | اليوم / Today | Morning greeting, energy rating check-in (1-5), today's scheduled tasks, focus launcher, spiritual trackers |
| `/[locale]/tasks` | المهام / Tasks | Eisenhower 2x2 matrix, quick-add parser (`@date !p1 #proj ~30m ^high`), task recommendations |
| `/[locale]/goals` | الأهداف / Goals | Goals by horizon (life, annual, quarterly, monthly), progress rollup from projects/tasks |
| `/[locale]/projects` | المشاريع / Projects | Active/completed projects, health status (`on_track`, `at_risk`, `completed`), progress bar |
| `/[locale]/habits` | العادات / Habits | Daily habits, current & longest streak, Islamic 5-prayer tracker, Quran reading, Morning/Evening Adhkar |
| `/[locale]/focus` | التركيز / Focus | Flowtime & Pomodoro timer, audio chime alert, automated time session logging to `time_entries` |
| `/[locale]/knowledge` | المعرفة / Knowledge | Second Brain notes with `[[wikilinks]]`, learning library for books/courses/articles with status and ratings |
| `/[locale]/reviews` | المراجعات / Reviews | Evening reflection form (mood, energy, wins, lessons) and history timeline |
| `/[locale]/settings` | الإعدادات / Settings | Profile name, timezone, week starts on, theme toggle (light/dark/system) |

---

## 5. Verification & Quality Gates

| Quality Gate | Tooling | Status | Details |
|---|---|---|---|
| **TypeScript Build** | Turbopack / Next.js | ✅ **Passing** | Zero compile errors across all 29 routes |
| **Linting** | ESLint 9 + Prettier | ✅ **Passing** | 0 errors across `@bawsala/core`, `@bawsala/db`, `@bawsala/web` |
| **Test Suite** | Vitest + PGlite | ✅ **Passing** | 162/162 tests passing (113 core, 24 db, 19 web, 6 i18n) |
| **Database Migrations** | PostgreSQL / PGlite | ✅ **Passing** | Real in-memory postgres migrations & service integration tests |
| **AI Peer Review** | GitLab Duo CLI / Claude | ✅ **Audited** | Claude Fable 5.1 review executed, feedback addressed |

---

## 6. Upcoming Milestones (Roadmap Next Steps)

1. **Phase 2.5 Polish:** ✅ **Completed**
   - Expanded `today/page.tsx` into a central execution cockpit (recommended task, quick start focus session, quick-add bar, today's action checklist).
   - Added specialized spiritual tracker widgets (`PrayerTracker`, `QuranTracker`, `AdhkarTracker`) with streak and progress calculation.
2. **Phase 3 — Knowledge & Time Management:** ✅ **Completed**
   - Notes & Second Brain with wikilinks (`[[link]]`) and categories.
   - Learning library for books, courses, articles with reading status and star ratings.
   - Automated time tracking entries (`time_entries` table) linked to tasks, projects, and focus sessions.
3. **Phase 4 — AI Integrations:**
   - Automated weekly review summaries and task breakdown engine.
