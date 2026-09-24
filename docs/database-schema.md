# مخطط قاعدة البيانات

> PostgreSQL (Supabase) · Drizzle ORM · RLS على كل جدول

## 1. اصطلاحات عامة

كل جدول (ما لم يُذكر خلاف ذلك) يحوي:

```sql
id          uuid primary key default gen_random_uuid(),
user_id     uuid not null references auth.users(id) on delete cascade,
created_at  timestamptz not null default now(),
updated_at  timestamptz not null default now(),   -- trigger set_updated_at()
deleted_at  timestamptz                            -- soft delete
```

- Index مركّب على `(user_id, deleted_at)` في كل جدول.
- `workspace_id uuid` يُضاف في مرحلة SaaS بـ migration واحدة.
- الحقول النصية الحرة `text`، الحقول المرنة `jsonb`.

### سياسة RLS النموذجية

```sql
alter table tasks enable row level security;

create policy "owner_all" on tasks
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
```

---

## 2. ERD

```mermaid
erDiagram
    profiles ||--o{ visions : has
    profiles ||--o{ areas : has
    visions  ||--o{ goals : contains
    goals    ||--o{ goals : "parent_id (annual→quarterly→monthly)"
    areas    ||--o{ goals : groups
    areas    ||--o{ projects : groups
    goals    ||--o{ projects : drives
    projects ||--o{ tasks : contains
    goals    ||--o{ tasks : "direct contribution (optional)"
    tasks    ||--o{ tasks : "parent_task_id (subtasks)"

    habit_categories ||--o{ habits : classifies
    habits   ||--o{ habit_logs : logs
    goals    ||--o{ habits : supports

    templates ||--o{ reviews : structures
    profiles  ||--o{ reviews : writes

    notes     ||--o{ note_links : from
    notes     ||--o{ note_links : to
    notes     }o--o{ tags : note_tags
    books     ||--o{ book_highlights : has
    books     ||--o{ notes : "book notes"
    courses   ||--o{ course_lessons : has
    courses   }o--o{ skills : course_skills

    tasks     ||--o{ time_entries : tracked
    projects  ||--o{ time_entries : tracked

    attachments }o--|| notes : polymorphic
```

---

## 3. الجداول

### 3.1 الهوية

**`profiles`** (id = auth.users.id، بدون user_id)

| العمود                  | النوع                       | ملاحظات                          |
| ----------------------- | --------------------------- | -------------------------------- |
| id                      | uuid PK → auth.users        |                                  |
| display_name            | text                        |                                  |
| avatar_url              | text                        |                                  |
| locale                  | text default 'ar'           | `ar` / `en`                      |
| timezone                | text default 'Africa/Cairo' | لحساب اليوم والـ Streaks         |
| theme                   | text default 'system'       | `light` / `dark` / `system`      |
| accent_color            | text default 'neutral'      |                                  |
| week_starts_on          | smallint default 6          | 6 = السبت                        |
| current_energy          | smallint                    | 1..5 يُحدَّث من المراجعة اليومية |
| priority_weights        | jsonb                       | تخصيص أوزان محرك الأولويات       |
| role                    | text default 'user'         |                                  |
| onboarding_completed_at | timestamptz                 |                                  |

---

### 3.2 الهرم: Vision → Goals → Areas → Projects → Tasks

**`visions`**

| العمود        | النوع                | ملاحظات               |
| ------------- | -------------------- | --------------------- |
| title         | text not null        |                       |
| statement     | text                 | نص الرؤية             |
| horizon_years | smallint default 5   |                       |
| is_active     | boolean default true | رؤية نشطة واحدة عادةً |

**`areas`** (مجالات الحياة: صحة، عمل، إيمان، عائلة...)

| العمود     | النوع         | ملاحظات           |
| ---------- | ------------- | ----------------- |
| name       | text not null |                   |
| icon       | text          | اسم أيقونة lucide |
| color      | text          | من palette محدودة |
| sort_order | integer       |                   |

**`goals`**

| العمود          | النوع                 | ملاحظات                                                  |
| --------------- | --------------------- | -------------------------------------------------------- |
| vision_id       | uuid → visions        | nullable                                                 |
| area_id         | uuid → areas          | nullable                                                 |
| parent_id       | uuid → goals          | هرم: life → annual → quarterly → monthly                 |
| title           | text not null         |                                                          |
| description     | text                  |                                                          |
| horizon         | text not null         | `life` / `annual` / `quarterly` / `monthly`              |
| period_start    | date                  |                                                          |
| period_end      | date                  |                                                          |
| status          | text default 'active' | `draft` / `active` / `achieved` / `abandoned` / `paused` |
| priority        | smallint default 3    | 1..5 يدخل في `goal_contribution`                         |
| metric_type     | text                  | `percent` / `number` / `boolean`                         |
| metric_target   | numeric               | مثال: 24 كتاباً                                          |
| metric_current  | numeric               |                                                          |
| manual_progress | numeric               | 0..100 يتجاوز الحساب الآلي إن وُجد                       |
| sort_order      | integer               |                                                          |

Index: `(user_id, horizon, status)`, `(parent_id)`.

**`projects`**

| العمود       | النوع                 | ملاحظات                                                     |
| ------------ | --------------------- | ----------------------------------------------------------- |
| goal_id      | uuid → goals          | nullable                                                    |
| area_id      | uuid → areas          | nullable                                                    |
| title        | text not null         |                                                             |
| description  | text                  |                                                             |
| status       | text default 'active' | `backlog` / `active` / `on_hold` / `completed` / `archived` |
| weight       | numeric default 1     | وزنه داخل الهدف                                             |
| start_date   | date                  |                                                             |
| due_date     | date                  |                                                             |
| completed_at | timestamptz           |                                                             |
| color        | text                  |                                                             |
| sort_order   | integer               |                                                             |

**`tasks`**

| العمود               | النوع                 | ملاحظات                                                 |
| -------------------- | --------------------- | ------------------------------------------------------- |
| project_id           | uuid → projects       | nullable (Inbox)                                        |
| goal_id              | uuid → goals          | مساهمة مباشرة دون مشروع                                 |
| parent_task_id       | uuid → tasks          | Subtasks                                                |
| title                | text not null         |                                                         |
| description          | text                  |                                                         |
| status               | text default 'todo'   | `inbox` / `todo` / `in_progress` / `done` / `cancelled` |
| importance           | smallint default 3    | 1..5                                                    |
| urgency              | smallint              | 1..5 يُحسب من due_date إن لم يُحدد يدوياً               |
| impact               | smallint default 3    | 1..5                                                    |
| difficulty           | smallint default 3    | 1..5                                                    |
| energy               | text default 'medium' | `low` / `medium` / `high`                               |
| estimate_minutes     | integer               |                                                         |
| actual_minutes       | integer               | يُجمع من time_entries                                   |
| due_date             | date                  |                                                         |
| due_time             | time                  |                                                         |
| scheduled_date       | date                  | يوم التنفيذ المخطط (Daily Actions)                      |
| priority_score       | numeric               | يُحسب في Service ويُخزَّن للترتيب                       |
| eisenhower           | text                  | `q1` / `q2` / `q3` / `q4` مشتق                          |
| recurrence_rule      | text                  | RFC 5545 RRULE                                          |
| recurrence_parent_id | uuid → tasks          |                                                         |
| completed_at         | timestamptz           |                                                         |
| sort_order           | integer               |                                                         |

Indexes: `(user_id, scheduled_date)`, `(user_id, status, due_date)`, `(project_id)`, `(user_id, priority_score desc)`.

**`progress_cache`**

| العمود      | النوع       | ملاحظات                       |
| ----------- | ----------- | ----------------------------- |
| entity_type | text        | `project` / `goal` / `vision` |
| entity_id   | uuid        |                               |
| progress    | numeric     | 0..100                        |
| total_tasks | integer     |                               |
| done_tasks  | integer     |                               |
| computed_at | timestamptz |                               |

PK: `(entity_type, entity_id)`. يُحدَّث عبر trigger على `tasks` و `projects` و `goals`.

---

### 3.3 العادات

**`habit_categories`** (قابلة للتخصيص، مع فئات مبدئية)

| العمود     | النوع                  | ملاحظات                 |
| ---------- | ---------------------- | ----------------------- |
| name       | text not null          |                         |
| kind       | text default 'general' | `general` / `spiritual` |
| icon       | text                   |                         |
| sort_order | integer                |                         |

فئات مبدئية تُنشأ عند التسجيل: صحة، تعلم، عمل، علاقات، **قرآن**، **صلاة**، **أذكار**، **تأمل وتفكر**.

**`habits`**

| العمود         | النوع                   | ملاحظات                                    |
| -------------- | ----------------------- | ------------------------------------------ |
| category_id    | uuid → habit_categories |                                            |
| goal_id        | uuid → goals            | nullable                                   |
| name           | text not null           |                                            |
| description    | text                    |                                            |
| frequency      | text not null           | `daily` / `weekly` / `monthly`             |
| target_count   | integer default 1       | مرات لكل فترة                              |
| days_of_week   | smallint[]              | للعادات اليومية المحددة بأيام              |
| value_type     | text default 'boolean'  | `boolean` / `count` / `duration` / `pages` |
| target_value   | numeric                 | مثال: 5 صفحات، 20 دقيقة                    |
| difficulty     | smallint default 3      | 1..5                                       |
| impact_score   | smallint default 3      | 1..5                                       |
| reminder_time  | time                    |                                            |
| current_streak | integer default 0       | cache                                      |
| longest_streak | integer default 0       | cache                                      |
| is_archived    | boolean default false   |                                            |
| preset         | text                    | مثال: `prayers` يفعّل واجهة الصلوات الخمس  |
| sort_order     | integer                 |                                            |

**`habit_logs`**

| العمود    | النوع             | ملاحظات                                              |
| --------- | ----------------- | ---------------------------------------------------- |
| habit_id  | uuid → habits     |                                                      |
| log_date  | date not null     |                                                      |
| value     | numeric default 1 |                                                      |
| completed | boolean           | يُحسب: value >= target_value                         |
| metadata  | jsonb             | مثال الصلاة: `{"fajr":"on_time","dhuhr":"late",...}` |
| note      | text              |                                                      |

Unique: `(habit_id, log_date)`.

---

### 3.4 المراجعات والقوالب

**`templates`**

| العمود     | النوع          | ملاحظات                                                                                                                                                      |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| user_id    | uuid           | null = قالب نظام                                                                                                                                             |
| type       | text not null  | `daily_review` / `weekly_review` / `monthly_review` / `quarterly_review` / `yearly_review` / `daily_plan` / `project` / `goal` / `journal` / `learning_plan` |
| name       | text not null  |                                                                                                                                                              |
| schema     | jsonb not null | مصفوفة حقول: `[{key, label_ar, label_en, type, required}]`                                                                                                   |
| is_default | boolean        |                                                                                                                                                              |

**`reviews`**

| العمود       | النوع            | ملاحظات                                                 |
| ------------ | ---------------- | ------------------------------------------------------- |
| template_id  | uuid → templates |                                                         |
| type         | text not null    | `daily` / `weekly` / `monthly` / `quarterly` / `yearly` |
| period_start | date not null    |                                                         |
| period_end   | date not null    |                                                         |
| answers      | jsonb            | إجابات حسب schema القالب                                |
| mood         | smallint         | 1..5                                                    |
| energy       | smallint         | 1..5                                                    |
| wins         | text[]           |                                                         |
| failures     | text[]           |                                                         |
| lessons      | text[]           |                                                         |
| snapshot     | jsonb            | لقطة إحصائية وقت المراجعة (مهام، عادات، وقت)            |
| completed_at | timestamptz      |                                                         |

Unique: `(user_id, type, period_start)`.

---

### 3.5 إدارة المعرفة (Phase 3)

**`notes`**

| العمود       | النوع               | ملاحظات                                                       |
| ------------ | ------------------- | ------------------------------------------------------------- |
| title        | text                |                                                               |
| content      | jsonb               | Tiptap JSON                                                   |
| content_text | text                | نص خام للبحث (tsvector generated)                             |
| type         | text default 'note' | `note` / `journal` / `book_note` / `course_note` / `resource` |
| para         | text                | `project` / `area` / `resource` / `archive`                   |
| project_id   | uuid → projects     |                                                               |
| area_id      | uuid → areas        |                                                               |
| source_type  | text                | `book` / `course`                                             |
| source_id    | uuid                |                                                               |
| is_pinned    | boolean             |                                                               |

Index: `gin(to_tsvector('simple', content_text))`.

**`note_links`**: `from_note_id`, `to_note_id`, `context text` — Unique على الزوج.

**`tags`**: `name`, `color` — Unique `(user_id, name)`.

**`note_tags`**: `note_id`, `tag_id` — PK مركّب.

**`attachments`** (polymorphic)

| العمود       | النوع         | ملاحظات                                         |
| ------------ | ------------- | ----------------------------------------------- |
| entity_type  | text          | `note` / `task` / `project` / `review` / `book` |
| entity_id    | uuid          |                                                 |
| storage_path | text not null |                                                 |
| file_name    | text          |                                                 |
| mime_type    | text          |                                                 |
| size_bytes   | integer       |                                                 |

---

### 3.6 التعلم (Phase 3)

**`books`**: `title`, `author`, `cover_url`, `total_pages`, `current_page`, `status` (`wishlist`/`reading`/`finished`/`abandoned`), `rating` 1..5, `started_at`, `finished_at`, `goal_id`, `review text`.

**`book_highlights`**: `book_id`, `text`, `page`, `note`, `chapter`.

**`courses`**: `title`, `platform`, `url`, `status`, `total_lessons`, `completed_lessons`, `goal_id`, `started_at`, `finished_at`.

**`course_lessons`**: `course_id`, `title`, `sort_order`, `completed_at`, `note`.

**`skills`**: `name`, `level` 1..5, `area_id`.

**`course_skills`**: `course_id`, `skill_id`.

---

### 3.7 الوقت (Phase 3)

**`time_entries`**

| العمود           | النوع                | ملاحظات                                                                    |
| ---------------- | -------------------- | -------------------------------------------------------------------------- |
| task_id          | uuid → tasks         | nullable                                                                   |
| project_id       | uuid → projects      | nullable                                                                   |
| category         | text                 | `deep_work` / `shallow` / `meeting` / `learning` / `break` / `distraction` |
| session_type     | text                 | `manual` / `pomodoro` / `flowtime` / `deep_work`                           |
| started_at       | timestamptz not null |                                                                            |
| ended_at         | timestamptz          | null = جارية                                                               |
| duration_seconds | integer              | generated                                                                  |
| focus_rating     | smallint             | 1..5                                                                       |
| note             | text                 |                                                                            |

Index: `(user_id, started_at desc)`.

**`calendar_connections`**: `provider`, `access_token` (مشفر عبر `pgsodium`/Vault), `refresh_token`, `calendar_id`, `sync_enabled`.

---

## 4. الدوال والـ Triggers

```sql
-- تحديث updated_at
create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- إعادة حساب تقدم المشروع عند تغيير مهمة
create function recompute_project_progress(p_project_id uuid) returns void
language sql as $$
  insert into progress_cache(entity_type, entity_id, progress, total_tasks, done_tasks, computed_at)
  select 'project', p_project_id,
         coalesce(100.0 * sum(case when status='done' then coalesce(estimate_minutes,1) else 0 end)
                  / nullif(sum(coalesce(estimate_minutes,1)),0), 0),
         count(*), count(*) filter (where status='done'), now()
  from tasks where project_id = p_project_id and deleted_at is null
  on conflict (entity_type, entity_id) do update
    set progress=excluded.progress, total_tasks=excluded.total_tasks,
        done_tasks=excluded.done_tasks, computed_at=now();
$$;
-- ثم recompute_goal_progress(goal_id) و recompute_vision_progress(vision_id) بنفس النمط

-- Streaks (pg_cron يومياً)
select cron.schedule('recalc-streaks', '10 0 * * *', $$select recalculate_streaks()$$);
```

---

## 5. ترتيب الـ Migrations

1. `0001_profiles_and_settings`
2. `0002_hierarchy` (visions, areas, goals, projects, tasks, progress_cache)
3. `0003_habits`
4. `0004_templates_reviews` + seed قوالب النظام
5. `0005_knowledge` (Phase 3)
6. `0006_learning` (Phase 3)
7. `0007_time` (Phase 3)
8. `0008_ai_embeddings` — `pgvector` (Phase 4)
9. `0009_workspaces` (Phase 6)
