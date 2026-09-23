import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { createTemplateSchema, LOCALES } from "@bawsala/core";
import * as schema from "../src/schema";
import { DEFAULT_HABIT_CATEGORIES, defaultHabitCategoryRows } from "../src/seed/habit-categories";
import { SYSTEM_TEMPLATES } from "../src/seed/templates";

const migrationsDir = join(__dirname, "..", "migrations");
const migrationSql = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(join(migrationsDir, f), "utf8"))
  .join("\n");

const tableNames = (Object.values(schema) as unknown[])
  .filter((v): v is PgTable => is(v, PgTable))
  .map((t) => getTableName(t));

describe("schema", () => {
  it("exports the core and phase 3 tables", () => {
    expect([...tableNames].sort()).toEqual(
      [
        "areas",
        "goals",
        "habit_categories",
        "habit_logs",
        "habits",
        "note_tags",
        "notes",
        "profiles",
        "progress_cache",
        "projects",
        "resources",
        "reviews",
        "tags",
        "tasks",
        "templates",
        "time_entries",
        "visions",
      ].sort(),
    );
  });
});

describe("migrations", () => {
  it("enable RLS and define at least one policy for every table", () => {
    for (const name of tableNames) {
      expect(migrationSql, `RLS on ${name}`).toContain(
        `ALTER TABLE "${name}" ENABLE ROW LEVEL SECURITY`,
      );
      expect(migrationSql, `policy on ${name}`).toMatch(
        new RegExp(`CREATE POLICY "[a-z_]+" ON "${name}"`),
      );
    }
  });

  it("install the profile bootstrap and progress rollup triggers", () => {
    expect(migrationSql).toContain("create trigger on_auth_user_created");
    expect(migrationSql).toContain("create trigger tasks_progress");
    expect(migrationSql).toContain("create trigger projects_progress");
    expect(migrationSql).toContain("create trigger goals_progress");
  });
});

describe("seed data", () => {
  it("system templates conform to the core template schema", () => {
    for (const t of SYSTEM_TEMPLATES) {
      const result = createTemplateSchema.safeParse({ ...t, isDefault: true });
      expect(result.success, `${t.type}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    }
  });

  it("system templates cover every review type once", () => {
    const types = SYSTEM_TEMPLATES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
    for (const review of ["daily", "weekly", "monthly", "quarterly", "yearly"]) {
      expect(types).toContain(`${review}_review`);
    }
  });

  it("template field keys are unique within a template", () => {
    for (const t of SYSTEM_TEMPLATES) {
      const keys = t.schema.map((f) => f.key);
      expect(new Set(keys).size, t.type).toBe(keys.length);
    }
  });

  it("default habit categories are translated for every locale and include the spiritual set", () => {
    for (const c of DEFAULT_HABIT_CATEGORIES) {
      for (const locale of LOCALES) expect(c.name[locale]).toBeTruthy();
    }
    const spiritual = DEFAULT_HABIT_CATEGORIES.filter((c) => c.kind === "spiritual").map(
      (c) => c.key,
    );
    expect(spiritual).toEqual(expect.arrayContaining(["quran", "prayer", "adhkar"]));
  });

  it("builds insert rows for a user", () => {
    const rows = defaultHabitCategoryRows("00000000-0000-0000-0000-000000000001", "ar");
    expect(rows).toHaveLength(DEFAULT_HABIT_CATEGORIES.length);
    expect(rows[0]).toMatchObject({ name: "صحة", kind: "general", sortOrder: 0 });
  });
});
