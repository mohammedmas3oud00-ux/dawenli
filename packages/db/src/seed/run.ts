import { isNull, sql } from "drizzle-orm";
import { createDb } from "../client";
import { templates } from "../schema";
import { SYSTEM_TEMPLATES } from "./templates";

/**
 * Upserts system templates (user_id IS NULL). Idempotent — safe to run on every deploy.
 * Requires DATABASE_URL with a role that bypasses RLS (service role / postgres).
 */
export async function seedSystemTemplates(connectionString: string): Promise<number> {
  const db = createDb(connectionString);
  let count = 0;
  for (const t of SYSTEM_TEMPLATES) {
    await db
      .insert(templates)
      .values({ type: t.type, name: t.name, schema: t.schema, isDefault: true, userId: null })
      .onConflictDoUpdate({
        target: [templates.type, templates.name],
        targetWhere: isNull(templates.userId),
        set: { schema: t.schema, isDefault: true, updatedAt: sql`now()` },
      });
    count += 1;
  }
  return count;
}

const isDirectRun =
  typeof process !== "undefined" && process.argv[1]?.replace(/\\/g, "/").endsWith("seed/run.ts");

if (isDirectRun) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  seedSystemTemplates(url)
    .then((n) => {
      console.log(`Seeded ${n} system templates`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
