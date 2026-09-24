import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Database } from "./client";
import * as schema from "./schema";

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_USER_EMAIL = "demo@bawsala.life";

const AUTH_SHIM = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
  end $$;
  create or replace function auth.uid() returns uuid language sql stable as $$
    select '${DEMO_USER_ID}'::uuid
  $$;
`;
function findMigrationsDir(): string {
  const candidates = [
    resolve(process.cwd(), "packages/db/migrations"),
    resolve(process.cwd(), "../../packages/db/migrations"),
    resolve(process.cwd(), "../packages/db/migrations"),
    resolve(process.cwd(), "migrations"),
  ];

  for (const c of candidates) {
    if (
      existsSync(/* turbopackIgnore: true */ c) &&
      existsSync(
        /* turbopackIgnore: true */ join(c, "0000_init_profiles_hierarchy_habits_reviews.sql"),
      )
    ) {
      return c;
    }
  }

  throw new Error(`Could not find migrations directory in candidates: ${candidates.join(", ")}`);
}

function getMigrationStatements(migrationsDir: string): string[] {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .flatMap((f) =>
      readFileSync(join(migrationsDir, f), "utf8")
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean),
    );
}

async function seedDemoData(client: PGlite): Promise<void> {
  // Every insert is idempotent, so retrying after an interrupted seed repairs
  // any partially populated embedded database.
  // 1. Create auth user (which triggers profile creation)
  await client.exec(`
      insert into auth.users (id, email, raw_user_meta_data)
      values ('${DEMO_USER_ID}', '${DEMO_USER_EMAIL}', '{"locale":"ar","full_name":"مستخدم تجريبي"}'::jsonb)
      on conflict (id) do nothing;
  `);

  // Ensure profile exists
  await client.exec(`
      insert into profiles (id, display_name, timezone, week_starts_on, locale, theme)
      values ('${DEMO_USER_ID}', 'مستخدم تجريبي (Demo)', 'UTC', 0, 'ar', 'system')
      on conflict (id) do nothing;
  `);

  // 2. Areas
  await client.exec(`
      insert into areas (id, user_id, name, color, icon, sort_order)
      values
        ('10000000-0000-0000-0000-000000000001', '${DEMO_USER_ID}', 'العمل والمشاريع', '#3b82f6', 'briefcase', 1),
        ('10000000-0000-0000-0000-000000000002', '${DEMO_USER_ID}', 'الصحة واللياقة', '#10b981', 'activity', 2),
        ('10000000-0000-0000-0000-000000000003', '${DEMO_USER_ID}', 'الجانب الإيماني', '#8b5cf6', 'heart', 3),
        ('10000000-0000-0000-0000-000000000004', '${DEMO_USER_ID}', 'التعلم والتطوير', '#f59e0b', 'book-open', 4)
      on conflict (id) do nothing;
  `);

  // 3. Goals
  await client.exec(`
      insert into goals (id, user_id, area_id, title, horizon, priority)
      values
        ('20000000-0000-0000-0000-000000000001', '${DEMO_USER_ID}', '10000000-0000-0000-0000-000000000001', 'إطلاق الإصدار الأول من بوصلة 1.0', 'annual', 5),
        ('20000000-0000-0000-0000-000000000002', '${DEMO_USER_ID}', '10000000-0000-0000-0000-000000000003', 'المحافظة على صلاة الفجر وقراءة ورد القرآن يومياً', 'annual', 5),
        ('20000000-0000-0000-0000-000000000003', '${DEMO_USER_ID}', '10000000-0000-0000-0000-000000000004', 'قراءة 12 كتاباً في القيادة والإنتاجية', 'annual', 4)
      on conflict (id) do nothing;
  `);

  // 4. Projects
  await client.exec(`
      insert into projects (id, user_id, goal_id, area_id, title, description, status, weight)
      values
        ('30000000-0000-0000-0000-000000000001', '${DEMO_USER_ID}', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'المرحلة 3: إدارة الوقت والمعرفة', 'بناء مؤقت التركيز وملاحظات المعرفة', 'active', 1),
        ('30000000-0000-0000-0000-000000000002', '${DEMO_USER_ID}', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'بناء مكتبة المعرفة والقراءة', 'تلخيص الكتب والمقالات', 'active', 1)
      on conflict (id) do nothing;
  `);

  // 5. Tasks (Q1, Q2, Q3)
  const todayStr = new Date().toISOString().split("T")[0];
  await client.exec(`
      insert into tasks (id, user_id, project_id, title, status, importance, urgency, impact, difficulty, energy, estimate_minutes, actual_minutes, due_date, scheduled_date, priority_score, eisenhower)
      values
        ('40000000-0000-0000-0000-000000000001', '${DEMO_USER_ID}', '30000000-0000-0000-0000-000000000001', 'مراجعة معمارية المرحلة 3 والتحقق من RLS', 'todo', 5, 5, 5, 3, 'high', 45, 45, '${todayStr}', '${todayStr}', 8.8, 'do_first'),
        ('40000000-0000-0000-0000-000000000002', '${DEMO_USER_ID}', '30000000-0000-0000-0000-000000000001', 'جلسة عمل عميق لبناء محرك تفكيك المهام الذكي', 'todo', 5, 3, 5, 4, 'high', 60, NULL, NULL, '${todayStr}', 7.5, 'schedule'),
        ('40000000-0000-0000-0000-000000000003', '${DEMO_USER_ID}', '30000000-0000-0000-0000-000000000002', 'قراءة ملخص كتاب Building a Second Brain', 'todo', 4, 2, 4, 2, 'medium', 30, NULL, NULL, NULL, 6.2, 'schedule'),
        ('40000000-0000-0000-0000-000000000004', '${DEMO_USER_ID}', '30000000-0000-0000-0000-000000000001', 'تنظيم قائمة البريد ومسودة الاجتماع الأسبوعي', 'todo', 2, 4, 2, 2, 'low', 20, NULL, '${todayStr}', '${todayStr}', 4.8, 'delegate')
      on conflict (id) do nothing;
  `);

  // 6. Habits
  await client.exec(`
      insert into habits (id, user_id, name, frequency, target_count, current_streak, longest_streak, preset)
      values
        ('50000000-0000-0000-0000-000000000001', '${DEMO_USER_ID}', 'الصلوات الخمس في جماعة وفي وقتها', 'daily', 5, 7, 14, 'prayers'),
        ('50000000-0000-0000-0000-000000000002', '${DEMO_USER_ID}', 'ورد القرآن الكريم (جزء يومياً)', 'daily', 1, 5, 21, 'quran'),
        ('50000000-0000-0000-0000-000000000003', '${DEMO_USER_ID}', 'أذكار الصباح والمساء', 'daily', 2, 12, 30, 'adhkar'),
        ('50000000-0000-0000-0000-000000000004', '${DEMO_USER_ID}', 'ممارسة الرياضة 30 دقيقة', 'daily', 1, 3, 10, 'custom')
      on conflict (id) do nothing;
  `);

  // 7. Time entries
  await client.exec(`
      insert into time_entries (id, user_id, task_id, project_id, duration_minutes, mode, started_at, ended_at, notes)
      values
        ('60000000-0000-0000-0000-000000000001', '${DEMO_USER_ID}', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 25, 'pomodoro', now() - interval '2 hours', now() - interval '95 minutes', 'مراجعة الاختبارات'),
        ('60000000-0000-0000-0000-000000000002', '${DEMO_USER_ID}', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 50, 'deep_work', now() - interval '80 minutes', now() - interval '30 minutes', 'تطبيق الإصلاحات الجراحية')
      on conflict (id) do nothing;
  `);

  // 8. Knowledge Notes & Resources
  await client.exec(`
      insert into notes (id, user_id, title, content, category, is_pinned)
      values
        ('70000000-0000-0000-0000-000000000001', '${DEMO_USER_ID}', 'المعمارية الأساسية لنظام [[بوصلة]]', 'نظام بوصلة يربط بين الرؤية العليا، والأهداف السنوية، والمشاريع، وصولاً إلى [[العمل اليومي]] ومؤقت التركيز.', 'concept', true),
        ('70000000-0000-0000-0000-000000000002', '${DEMO_USER_ID}', 'أفكار لميزات الذكاء الاصطناعي في المرحلة 4', '1. تفكيك المهام الكبيرة إلى خطوات إجرائية صغيرة.\n2. تلخيص الأسبوع واستخراج الدروس المستفادة.', 'idea', false)
      on conflict (id) do nothing;
  `);

  await client.exec(`
      insert into resources (id, user_id, title, type, author, status, rating)
      values
        ('80000000-0000-0000-0000-000000000001', '${DEMO_USER_ID}', 'Atomic Habits', 'book', 'James Clear', 'completed', 5),
        ('80000000-0000-0000-0000-000000000002', '${DEMO_USER_ID}', 'Building a Second Brain', 'book', 'Tiago Forte', 'in_progress', 5),
        ('80000000-0000-0000-0000-000000000003', '${DEMO_USER_ID}', 'Deep Work', 'book', 'Cal Newport', 'completed', 5)
      on conflict (id) do nothing;
  `);
}

let _embeddedClient: PGlite | null = null;
let _embeddedDbInstance: Database | null = null;
let _initReadyPromise: Promise<void> | null = null;

function ensureInitialized(client: PGlite): Promise<void> {
  if (_initReadyPromise) return _initReadyPromise;

  _initReadyPromise = (async () => {
    // Apply auth shim
    await client.exec(AUTH_SHIM);

    // Check if schema is already initialized
    const tableCheck = await client.query(`
      select 1 from information_schema.tables 
      where table_schema = 'public' and table_name = 'profiles'
    `);

    if (tableCheck.rows.length === 0) {
      // Run migrations
      const migrationsDir = findMigrationsDir();
      const statements = getMigrationStatements(migrationsDir);
      for (const statement of statements) {
        await client.exec(statement);
      }
    }

    // Seed demo data
    await seedDemoData(client);
  })();

  return _initReadyPromise;
}

/**
 * Synchronous getter returning the embedded Drizzle database handle.
 * Begins migrations and seed population asynchronously.
 */
export function getEmbeddedDb(): Database {
  if (_embeddedDbInstance) return _embeddedDbInstance;

  const dataDir = resolve(process.cwd(), ".pglite-data");
  try {
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
  } catch {
    // Fallback to memory
  }

  const client = new PGlite(existsSync(dataDir) ? dataDir : undefined);
  _embeddedClient = client;

  // Start initialization
  void ensureInitialized(client);

  const db = drizzle(client, { schema }) as unknown as Database;
  _embeddedDbInstance = db;
  return db;
}

/**
 * Ensures embedded database migrations and demo seed are completed.
 */
export async function ensureEmbeddedDbReady(): Promise<Database> {
  const db = getEmbeddedDb();
  if (_embeddedClient && _initReadyPromise) {
    await _initReadyPromise;
  }
  return db;
}

/**
 * Creates or retrieves the singleton embedded database.
 */
export async function getEmbeddedDatabase(): Promise<Database> {
  return ensureEmbeddedDbReady();
}
